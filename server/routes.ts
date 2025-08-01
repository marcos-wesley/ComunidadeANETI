import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertMemberApplicationSchema, insertDocumentSchema, insertMembershipPlanSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Object storage for document serving
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for documents
  app.post("/api/documents/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Create document record after upload
  app.post("/api/documents", isAuthenticated, async (req, res) => {
    if (!req.body.documentURL || !req.body.applicationId || !req.body.name || !req.body.type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userId = req.user?.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.documentURL,
        {
          owner: userId!,
          visibility: "private",
        }
      );

      const document = await storage.createDocument({
        applicationId: req.body.applicationId,
        name: req.body.name,
        type: req.body.type,
        filePath: objectPath,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Membership plans
  app.get("/api/membership-plans", async (req, res) => {
    try {
      const plans = await storage.getMembershipPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create membership plan (admin only)
  app.post("/api/membership-plans", isAuthenticated, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.sendStatus(403);
    }

    try {
      const validatedData = insertMembershipPlanSchema.parse(req.body);
      const plan = await storage.createMembershipPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating membership plan:", error);
      res.status(400).json({ error: "Invalid plan data" });
    }
  });

  // Member applications
  app.post("/api/member-applications", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMemberApplicationSchema.parse({
        ...req.body,
        userId: req.user?.id,
      });
      
      const application = await storage.createMemberApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating member application:", error);
      res.status(400).json({ error: "Invalid application data" });
    }
  });

  // Get user's applications
  app.get("/api/member-applications", isAuthenticated, async (req, res) => {
    try {
      const applications = await storage.getMemberApplicationsByUser(req.user!.id);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get pending applications (admin only)
  app.get("/api/admin/pending-applications", isAuthenticated, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.sendStatus(403);
    }

    try {
      const applications = await storage.getPendingApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching pending applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update application status (admin only)
  app.patch("/api/admin/applications/:id", isAuthenticated, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.sendStatus(403);
    }

    try {
      const { status, adminNotes } = req.body;
      const application = await storage.updateMemberApplication(req.params.id, {
        status,
        adminNotes,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // If approved, update user status
      if (status === "approved") {
        await storage.updateUser(application.userId, { isApproved: true });
      }

      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get application documents
  app.get("/api/applications/:id/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocumentsByApplication(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Social Feed API Routes
  
  // Get feed posts
  app.get("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const posts = await storage.getFeedPosts(userId!);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new post
  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { content, mediaType, mediaUrl, visibility, mentionedUsers } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Check if user can post globally (only Diretivo plan)
      if (visibility === "global") {
        const user = await storage.getUser(userId!);
        if (user?.planName !== "Diretivo") {
          return res.status(403).json({ error: "Only Diretivo members can post globally" });
        }
      }

      const post = await storage.createPost({
        authorId: userId!,
        content,
        mediaType,
        mediaUrl,
        visibility: visibility || "connections",
        mentionedUsers: mentionedUsers || [],
      });

      const postWithDetails = await storage.getPostWithDetails(post.id);
      res.status(201).json(postWithDetails);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Like/Unlike post
  app.post("/api/posts/:postId/like", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { postId } = req.params;

      const result = await storage.toggleLike(userId!, postId);
      res.json({ liked: result.liked, likes: result.likesCount });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete post
  app.delete("/api/posts/:postId", isAuthenticated, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      // Check if user owns the post or is admin
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.authorId !== userId && req.user!.planName !== "Diretivo") {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }

      await storage.deletePost(postId);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Report post
  app.post("/api/posts/:postId/report", isAuthenticated, async (req, res) => {
    try {
      const { postId } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

      await storage.reportPost(postId, userId, reason);
      res.json({ message: "Post reported successfully" });
    } catch (error) {
      console.error("Error reporting post:", error);
      res.status(500).json({ message: "Failed to report post" });
    }
  });

  // Get comments for post
  app.get("/api/posts/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getCommentsByPost(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add comment to post
  app.post("/api/posts/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { postId } = req.params;
      const { content, mentionedUsers } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      const comment = await storage.createComment({
        postId,
        authorId: userId!,
        content,
        mentionedUsers: mentionedUsers || [],
      });

      const commentWithAuthor = await storage.getCommentWithAuthor(comment.id);
      res.status(201).json(commentWithAuthor);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user connections
  app.get("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const connections = await storage.getUserConnections(userId!);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send connection request
  app.post("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { receiverId } = req.body;

      if (!receiverId) {
        return res.status(400).json({ error: "Receiver ID is required" });
      }

      if (userId === receiverId) {
        return res.status(400).json({ error: "Cannot connect to yourself" });
      }

      const connection = await storage.createConnectionRequest(userId!, receiverId);
      res.status(201).json({ success: true, connection });
    } catch (error) {
      console.error("Error creating connection request:", error);
      if (error instanceof Error && error.message === "Connection already exists") {
        return res.status(400).json({ error: "Connection already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Accept/Reject connection request
  app.put("/api/connections/:connectionId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { connectionId } = req.params;
      const { status } = req.body; // 'accepted' or 'rejected'

      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const connection = await storage.updateConnectionStatus(connectionId, status, userId!);
      
      if (!connection) {
        return res.status(404).json({ error: "Connection not found or unauthorized" });
      }

      res.json(connection);
    } catch (error) {
      console.error("Error updating connection:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all members for directory with connection status
  // Get user profile
  app.get("/api/profile/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user's profile
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user's profile for editing
  app.get("/api/profile/edit", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("=== PROFILE EDIT REQUEST ===");
      console.log("User from session:", req.user);
      console.log("Fetching profile for edit, userId:", userId);
      
      // First try the basic user fetch
      let user = await storage.getUserById(userId);
      console.log("getUserById result:", user);
      
      if (!user) {
        console.log("getUserById failed, trying basic select...");
        // Try direct database query as fallback
        const allUsers = await storage.getAllUsers();
        console.log("All users in database:", allUsers.map(u => ({ id: u.id, username: u.username })));
        
        user = allUsers.find(u => u.id === userId);
        console.log("Found user in all users:", user);
      }
      
      if (!user) {
        console.log("User not found for editing:", userId);
        return res.status(404).json({ error: "Profile not found" });
      }
      
      console.log("Profile found for edit:", user.username);
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile for edit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile
  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const updateData = req.body;
      
      console.log("Updating profile for userId:", userId);
      console.log("Update data:", updateData);
      
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      
      if (!updatedUser) {
        console.log("Profile not found for update:", userId);
        return res.status(404).json({ error: "Profile not found" });
      }
      
      console.log("Profile updated successfully:", updatedUser.username);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get upload URL for profile image
  app.post("/api/profile/upload-profile-image", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProfileImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting profile image upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get upload URL for cover image
  app.post("/api/profile/upload-cover-image", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getCoverImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting cover image upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update profile picture after upload
  app.put("/api/profile/profile-picture", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { imageURL } = req.body;

      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectPath(imageURL);

      const updatedUser = await storage.updateUserProfile(userId, {
        profilePicture: normalizedPath
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({
        profilePicture: normalizedPath,
        message: "Profile picture updated successfully"
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update cover photo after upload
  app.put("/api/profile/cover-photo", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { imageURL } = req.body;

      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectPath(imageURL);

      const updatedUser = await storage.updateUserProfile(userId, {
        coverPhoto: normalizedPath
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({
        coverPhoto: normalizedPath,
        message: "Cover photo updated successfully"
      });
    } catch (error) {
      console.error("Error updating cover photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/members", isAuthenticated, async (req, res) => {
    try {
      const { 
        page = '1', 
        limit = '20', 
        sortBy = 'recent',
        state,
        plan,
        gender,
        area,
        search
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'recent' | 'newest' | 'alphabetical',
        filters: {
          state: state as string,
          plan: plan as string,
          gender: gender as string,
          area: area as string,
          search: search as string,
        }
      };

      const members = await storage.getMembersWithStatus(req.user!.id, options);
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Follow a user
  app.post("/api/follows", isAuthenticated, async (req, res) => {
    try {
      const { followingId } = req.body;
      
      if (!followingId) {
        return res.status(400).json({ error: "Following ID is required" });
      }

      if (followingId === req.user!.id) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      // Check if user can follow (Junior, Pleno, Sênior only)
      const userPlan = req.user!.planName;
      if (!userPlan || !['Júnior', 'Pleno', 'Sênior'].includes(userPlan)) {
        return res.status(403).json({ error: "Only Junior, Pleno, and Sênior members can follow others" });
      }

      const follow = await storage.createFollow(req.user!.id, followingId);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Error creating follow:", error);
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  // Unfollow a user
  app.delete("/api/follows/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      await storage.removeFollow(req.user!.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing follow:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  // Search users for mentions
  app.get("/api/users/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      const users = await storage.searchUsers(q);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Fetch link metadata for previews
  app.post("/api/link-metadata", isAuthenticated, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL is required" });
      }

      // Import the fetchLinkMetadata function
      const { fetchLinkMetadata } = await import('./link-metadata');
      const metadata = await fetchLinkMetadata(url);
      
      res.json(metadata);
    } catch (error) {
      console.error("Error fetching link metadata:", error);
      res.status(500).json({ error: "Failed to fetch link metadata" });
    }
  });

  // Serve images from object storage
  app.get("/images/:imagePath(*)", async (req, res) => {
    try {
      const imagePath = req.params.imagePath;
      const objectStorageService = new ObjectStorageService();
      
      // Construct full path for private object
      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateDir}/${imagePath}`;
      
      const pathParts = fullPath.split("/");
      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join("/");
      
      const { objectStorageClient } = require("./objectStorage");
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
