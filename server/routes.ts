import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated, isAdminAuthenticated } from "./auth";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { NotificationService } from "./notificationService";
import { 
  insertMemberApplicationSchema, 
  insertDocumentSchema, 
  insertMembershipPlanSchema, 
  insertConversationSchema,
  insertMessageSchema,
  insertNotificationSchema,
  insertGroupSchema,
  membershipPlans 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import express from "express";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import multer from "multer";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Serve uploaded images statically
  app.use('/images', express.static(path.join(process.cwd(), 'public/uploads')));
  
  // Serve temp uploaded files during registration
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

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

  // Get upload URL for documents (authenticated users)
  app.post("/api/documents/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Temporary file upload during registration using multer
  const registrationUpload = multer({ 
    dest: 'public/uploads/temp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      // Accept images and PDFs
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Apenas imagens e PDFs são permitidos'));
      }
    }
  });

  // Upload endpoint for registration documents
  app.post("/api/documents/upload-registration", registrationUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const fileUrl = `/uploads/temp/${req.file.filename}`;
      
      res.json({ 
        success: true,
        fileId: req.file.filename,
        fileName: req.file.originalname,
        fileUrl: fileUrl,
        size: req.file.size,
        type: req.file.mimetype
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Falha no upload do arquivo" });
    }
  });

  // Check email availability (public endpoint)
  app.post("/api/check-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const existingUser = await storage.getUserByEmail(email);
      const existingApplication = await storage.getApplicationByEmail(email);
      
      const available = !existingUser && !existingApplication;
      
      res.json({ available });
    } catch (error) {
      console.error("Error checking email:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Check username availability (public endpoint)
  app.post("/api/check-username", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Nome de usuário é obrigatório" });
      }

      const existingUser = await storage.getUserByUsername(username);
      const existingApplication = await storage.getApplicationByUsername(username);
      
      const available = !existingUser && !existingApplication;
      
      res.json({ available });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Create Stripe subscription for paid plans
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { planId, email, fullName } = req.body;
      
      // Get plan details
      const plan = await storage.getMembershipPlan(planId);
      if (!plan || !plan.requiresPayment) {
        return res.status(400).json({ error: "Plano inválido ou gratuito" });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: email,
        name: fullName,
        metadata: {
          planId: planId,
          planName: plan.name
        }
      });

      // First create a price for this plan if not exists
      let priceId = plan.stripePriceId;
      
      if (!priceId) {
        // Create product first
        const product = await stripe.products.create({
          name: `ANETI - ${plan.name}`,
          description: plan.description || `Plano ${plan.name} da ANETI`,
          metadata: {
            planId: planId
          }
        });

        // Create price
        const price = await stripe.prices.create({
          unit_amount: plan.price, // price already in cents
          currency: 'brl',
          recurring: {
            interval: 'year'
          },
          product: product.id,
          metadata: {
            planId: planId
          }
        });

        priceId = price.id;

        // Update plan with Stripe IDs
        await db.update(membershipPlans)
          .set({ 
            stripePriceId: price.id, 
            stripeProductId: product.id 
          })
          .where(eq(membershipPlans.id, planId));
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceId
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planId: planId,
          planName: plan.name
        }
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        customerId: customer.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status
      });

    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Erro ao criar assinatura" });
    }
  });

  // Webhook for Stripe events
  app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // For now, we'll process without signature verification in development
      event = JSON.parse(req.body.toString());
    } catch (err) {
      console.error('Webhook signature verification failed.', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const subscription = event.data.object;
        console.log('Payment succeeded for subscription:', subscription.subscription);
        // Update payment status in database
        await storage.updateApplicationPaymentStatus(subscription.subscription, 'paid');
        break;
      case 'invoice.payment_failed':
        console.log('Payment failed for subscription:', event.data.object.subscription);
        await storage.updateApplicationPaymentStatus(event.data.object.subscription, 'failed');
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  });

  // Create document record after upload (authenticated users)
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

  // Create document record during registration (public endpoint)
  app.post("/api/register-documents", async (req, res) => {
    if (!req.body.documentURL || !req.body.applicationId || !req.body.name || !req.body.type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const document = await storage.createDocument({
        applicationId: req.body.applicationId,
        name: req.body.name,
        type: req.body.type,
        filePath: req.body.documentURL,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating registration document:", error);
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

  // Member applications (for logged in users)
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

  // Registration application (public endpoint)
  app.post("/api/register-application", async (req, res) => {
    try {
      // Hash the user's password for the registration
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(req.body.password || "temp-password");
      
      // Create a user with the actual registration data
      const tempUser = await storage.createUser({
        fullName: req.body.fullName,
        email: req.body.email,
        username: req.body.username,
        city: req.body.city || "",
        state: req.body.state || "",
        area: req.body.area || "",
        phone: req.body.phone || "",
        password: hashedPassword,
      });

      const validatedData = insertMemberApplicationSchema.parse({
        ...req.body,
        userId: tempUser.id,
      });
      
      const application = await storage.createMemberApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating registration application:", error);
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
  app.patch("/api/admin/applications/:id", isAdminAuthenticated, async (req, res) => {
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

      // If approved, update user status and create a proper member
      if (status === "approved") {
        await storage.updateUser(application.userId, { isApproved: true });
      }

      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve application (admin only)
  app.post("/api/admin/applications/:id/approve", isAdminAuthenticated, async (req, res) => {
    try {
      const application = await storage.updateMemberApplication(req.params.id, {
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Update user status to approved
      await storage.updateUser(application.userId, { isApproved: true });

      res.json({ message: "Application approved successfully", application });
    } catch (error) {
      console.error("Error approving application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reject application with notes (admin only)
  app.post("/api/admin/applications/:id/reject", isAdminAuthenticated, async (req, res) => {
    try {
      const { reason, requestDocuments } = req.body;
      const status = requestDocuments ? 'documents_requested' : 'rejected';
      
      const application = await storage.updateMemberApplication(req.params.id, {
        status,
        adminNotes: reason,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const message = requestDocuments 
        ? "Documents requested successfully" 
        : "Application rejected successfully";

      res.json({ message, application });
    } catch (error) {
      console.error("Error processing application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get application details (for users to view their own applications)
  app.get("/api/applications/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const application = await storage.getApplicationById(id);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      // Only allow users to view their own application
      if (application.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ error: "Failed to fetch application" });
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

  // Configure multer for local file uploads
  const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadType = req.url.includes('profile-image') ? 'profile-images' : 'cover-images';
      const uploadPath = path.join(process.cwd(), 'public/uploads', uploadType);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueId = randomUUID();
      const extension = path.extname(file.originalname);
      cb(null, `${uniqueId}${extension}`);
    }
  });

  const upload = multer({ 
    storage: uploadStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Upload profile image directly
  app.post("/api/profile/upload-profile-image", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const imagePath = `/images/profile-images/${req.file.filename}`;
      res.json({ uploadURL: `http://localhost:5000${imagePath}`, imagePath });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Upload cover image directly
  app.post("/api/profile/upload-cover-image", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const imagePath = `/images/cover-images/${req.file.filename}`;
      res.json({ uploadURL: `http://localhost:5000${imagePath}`, imagePath });
    } catch (error) {
      console.error("Error uploading cover image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Update profile picture after upload
  app.put("/api/profile/profile-picture", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { imagePath } = req.body;

      if (!imagePath) {
        return res.status(400).json({ error: "imagePath is required" });
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        profilePicture: imagePath
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({
        profilePicture: imagePath,
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
      const { imagePath } = req.body;

      if (!imagePath) {
        return res.status(400).json({ error: "imagePath is required" });
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        coverPhoto: imagePath
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({
        coverPhoto: imagePath,
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

  // Chat API routes
  
  // Get user conversations
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get specific conversation
  app.get("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id, req.user!.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create direct conversation with another user
  app.post("/api/conversations/direct", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const conversation = await storage.createDirectConversation(req.user!.id, userId);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating direct conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Create group conversation
  app.post("/api/conversations/group", isAuthenticated, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Group name is required" });
      }

      const conversation = await storage.createGroupConversation(req.user!.id, name, description);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating group conversation:", error);
      res.status(500).json({ error: "Failed to create group conversation" });
    }
  });

  // Add participant to group conversation
  app.post("/api/conversations/:id/participants", isAuthenticated, async (req, res) => {
    try {
      const { userId, role } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const participant = await storage.addParticipantToConversation(req.params.id, userId, role);
      res.json(participant);
    } catch (error) {
      console.error("Error adding participant:", error);
      res.status(500).json({ error: "Failed to add participant" });
    }
  });

  // Get messages from conversation
  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const messages = await storage.getConversationMessages(
        req.params.id,
        req.user!.id,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const { content, replyToId } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: "Message content is required" });
      }

      const message = await storage.sendMessage(req.params.id, req.user!.id, content.trim(), replyToId);
      
      // Get conversation details for notification
      const conversation = await storage.getConversation(req.params.id, req.user!.id);
      if (conversation) {
        // Send notifications to all other participants
        const otherParticipants = conversation.participants.filter(p => p.userId !== req.user!.id);
        
        for (const participant of otherParticipants) {
          await NotificationService.createMessageNotification(
            req.params.id,
            participant.userId,
            req.user!.id,
            req.user!.fullName,
            conversation.name
          );
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Mark messages as read
  app.post("/api/conversations/:id/read", isAuthenticated, async (req, res) => {
    try {
      await storage.markMessagesAsRead(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  // Search conversations
  app.get("/api/conversations/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      const conversations = await storage.searchConversations(req.user!.id, q);
      res.json(conversations);
    } catch (error) {
      console.error("Error searching conversations:", error);
      res.status(500).json({ error: "Failed to search conversations" });
    }
  });

  // Edit message
  app.put("/api/messages/:id", isAuthenticated, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: "Message content is required" });
      }

      const message = await storage.editMessage(req.params.id, req.user!.id, content.trim());
      res.json(message);
    } catch (error) {
      console.error("Error editing message:", error);
      res.status(500).json({ error: "Failed to edit message" });
    }
  });

  // Delete message
  app.delete("/api/messages/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMessage(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteConversation(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Notification Routes
  
  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const { limit } = req.query;
      const notifications = await storage.getUserNotifications(
        req.user!.id,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Create a notification (for system use)
  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.put("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Application appeal routes
  app.post("/api/applications/:id/appeal", isAuthenticated, multer().array('documents'), async (req, res) => {
    try {
      const { id } = req.params;
      const { message, type } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!message?.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!type || !['appeal', 'response'].includes(type)) {
        return res.status(400).json({ error: "Invalid appeal type" });
      }

      // Check if application exists and belongs to user
      const application = await storage.getApplicationById(id);
      if (!application || application.userId !== req.user!.id) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Create the appeal
      const appeal = await storage.createApplicationAppeal({
        applicationId: id,
        userId: req.user!.id,
        type,
        message: message.trim(),
      });

      // Handle file uploads if any (simplified for now)
      if (files && files.length > 0) {
        // For now, we'll just log the files - proper file handling would need to be implemented
        console.log('Files uploaded:', files.map(f => f.originalname));
      }

      // Update application status if it's an appeal - return to pending for admin review
      if (type === 'appeal') {
        await storage.updateApplication(id, {
          status: 'pending',
          adminNotes: application.adminNotes ? 
            application.adminNotes + `\n\n[Questionamento do usuário]: ${message}` :
            `[Questionamento do usuário]: ${message}`,
        });
      }

      res.status(201).json({ 
        success: true,
        appeal,
        message: type === 'appeal' 
          ? 'Questionamento enviado com sucesso!' 
          : 'Resposta e documentos enviados com sucesso!'
      });

    } catch (error) {
      console.error("Error creating application appeal:", error);
      res.status(500).json({ error: "Failed to create appeal" });
    }
  });



  // Admin User Authentication Routes (separate from member auth)
  
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Username and password are required" 
        });
      }

      // Check if this is the first admin user being created
      const adminUsers = await storage.getAllAdminUsers();
      
      if (adminUsers.length === 0) {
        // Create first admin user
        const { hashPassword } = await import("./auth-admin");
        const hashedPassword = await hashPassword(password);
        
        const firstAdmin = await storage.createAdminUser({
          username,
          email: `${username}@admin.aneti.org.br`,
          password: hashedPassword,
          fullName: "Administrador Principal",
          role: "super_admin",
        });

        req.session.adminUser = {
          adminUserId: firstAdmin.id,
          username: firstAdmin.username,
          role: firstAdmin.role,
          isAuthenticated: true,
        };

        return res.json({
          success: true,
          user: {
            id: firstAdmin.id,
            username: firstAdmin.username,
            fullName: firstAdmin.fullName,
            role: firstAdmin.role,
          },
          message: "First admin user created and logged in successfully",
        });
      }

      // Authenticate existing admin user
      const { authenticateAdmin } = await import("./auth-admin");
      const adminUser = await authenticateAdmin(username, password);
      
      if (!adminUser) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }
      req.session.adminUser = {
        adminUserId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        isAuthenticated: true,
      };

      res.json({
        success: true,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          fullName: adminUser.fullName,
          role: adminUser.role,
        },
        message: "Admin logged in successfully",
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.adminUser = null;
    res.json({ success: true, message: "Admin logged out successfully" });
  });

  // Check admin authentication status
  app.get("/api/admin/auth/check", (req, res) => {
    if (req.session?.adminUser?.isAuthenticated) {
      res.json({
        isAuthenticated: true,
        user: {
          id: req.session.adminUser.adminUserId,
          username: req.session.adminUser.username,
          role: req.session.adminUser.role,
        },
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // Admin middleware
  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (!req.session?.adminUser?.isAuthenticated) {
      return res.status(401).json({ 
        success: false, 
        message: "Admin authentication required" 
      });
    }
    req.adminUser = req.session.adminUser;
    next();
  };

  // Admin dashboard stats
  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const totalMembers = await storage.getAllUsers();
      const pendingApplications = await storage.getPendingApplications();
      
      res.json({
        totalMembers: totalMembers.length,
        pendingApplications: pendingApplications.length,
        adminUser: {
          username: req.adminUser.username,
          role: req.adminUser.role,
        },
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch admin statistics" 
      });
    }
  });

  // Get pending applications for admin
  app.get("/api/admin/applications", requireAdminAuth, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string || '',
        planName: req.query.planName as string || '',
        city: req.query.city as string || '',
        state: req.query.state as string || '',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };
      
      const offset = (filters.page - 1) * filters.limit;
      
      const applications = await storage.getFilteredApplications({
        ...filters,
        offset
      });
      
      const totalApplications = await storage.getApplicationsCount(filters);
      const totalPages = Math.ceil(totalApplications / filters.limit);
      
      res.json({
        applications,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: totalApplications,
          totalPages
        }
      });
    } catch (error) {
      console.error("Error fetching pending applications:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch pending applications" 
      });
    }
  });

  // Get specific application details (admin only)
  app.get("/api/admin/applications/:id", requireAdminAuth, async (req, res) => {
    try {
      const applicationId = req.params.id;
      const application = await storage.getMemberApplicationWithDetails(applicationId);
      
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: "Application not found" 
        });
      }

      res.json(application);
    } catch (error) {
      console.error("Error fetching application details:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch application details" 
      });
    }
  });

  // Get all members for admin
  app.get("/api/admin/members", requireAdminAuth, async (req, res) => {
    try {
      const { 
        page = '1', 
        limit = '10', 
        search = '', 
        planName = '', 
        city = '', 
        state = '' 
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const members = await storage.getFilteredUsers({
        search: search as string,
        planName: planName as string,
        city: city as string,
        state: state as string,
        limit: limitNum,
        offset
      });

      const total = await storage.getUsersCount({
        search: search as string,
        planName: planName as string,
        city: city as string,
        state: state as string
      });

      res.json({
        members,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch members" 
      });
    }
  });

  // Approve application
  app.post("/api/admin/applications/:id/approve", requireAdminAuth, async (req, res) => {
    try {
      const applicationId = req.params.id;
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: "Application not found" 
        });
      }

      // Update application status to approved
      await storage.updateApplication(applicationId, { 
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: req.adminUser.adminUserId,
      });

      res.json({ 
        success: true, 
        message: "Application approved successfully" 
      });
    } catch (error) {
      console.error("Error approving application:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to approve application" 
      });
    }
  });

  // Reject application
  app.post("/api/admin/applications/:id/reject", requireAdminAuth, async (req, res) => {
    try {
      const applicationId = req.params.id;
      const { reason, requestDocuments } = req.body;
      
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: "Application not found" 
        });
      }

      // Reject application with message or request documents
      const updatedApplication = await storage.rejectApplication(
        applicationId, 
        reason, 
        req.adminUser.adminUserId,
        requestDocuments
      );

      if (!updatedApplication) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to update application" 
        });
      }

      const action = requestDocuments ? 'Additional documents requested' : 'Application rejected';
      res.json({ 
        success: true, 
        message: `${action} successfully`,
        status: updatedApplication.status
      });
    } catch (error) {
      console.error("Error rejecting application:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to reject application" 
      });
    }
  });

  // Get specific member details for admin
  app.get("/api/admin/members/:id", requireAdminAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "Member not found" 
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching member details:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch member details" 
      });
    }
  });

  // Update member information (admin only)
  app.put("/api/admin/members/:id", requireAdminAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      
      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.id;
      delete updateData.createdAt;
      
      const updatedUser = await storage.updateUser(userId, {
        ...updateData,
        updatedAt: new Date()
      });
      
      if (!updatedUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Member not found" 
        });
      }

      res.json({ 
        success: true, 
        message: "Member information updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update member information" 
      });
    }
  });

  // Change member password (admin only)
  app.put("/api/admin/members/:id/password", requireAdminAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: "Password must be at least 6 characters long" 
        });
      }

      // Import hash function from auth
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(newPassword);
      
      const updatedUser = await storage.updateUserPassword(userId, hashedPassword);
      
      if (!updatedUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Member not found" 
        });
      }

      res.json({ 
        success: true, 
        message: "Password updated successfully"
      });
    } catch (error) {
      console.error("Error updating member password:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update member password" 
      });
    }
  });

  // Delete member (admin only)
  app.delete("/api/admin/members/:id", requireAdminAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Check if user exists first
      const existingUser = await storage.getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Member not found" 
        });
      }

      // Don't allow deleting admin users
      if (existingUser.role === 'admin') {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot delete admin users" 
        });
      }

      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to delete member" 
        });
      }

      res.json({ 
        success: true, 
        message: "Member deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete member" 
      });
    }
  });

  // Groups management routes (Admin only)
  
  // Get all groups
  app.get("/api/admin/groups", requireAdminAuth, async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch groups" 
      });
    }
  });

  // Create new group
  app.post("/api/admin/groups", requireAdminAuth, async (req, res) => {
    try {
      const groupData = insertGroupSchema.parse(req.body);
      
      // Validate moderator is pleno/senior level
      const moderator = await storage.getUserById(groupData.moderatorId);
      if (!moderator || !['Pleno', 'Sênior', 'Honra', 'Diretivo'].includes(moderator.planName || '')) {
        return res.status(400).json({
          success: false,
          message: "Moderador deve ser do nível Pleno, Sênior, Honra ou Diretivo"
        });
      }

      const newGroup = await storage.createGroup({
        ...groupData,
        createdBy: req.adminUser.adminUserId
      });

      res.json({
        success: true,
        message: "Grupo criado com sucesso",
        group: newGroup
      });
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create group" 
      });
    }
  });

  // Get eligible users for group moderation
  app.get("/api/admin/groups/eligible-moderators", requireAdminAuth, async (req, res) => {
    try {
      const users = await storage.getUsersForGroupModeration();
      res.json(users);
    } catch (error) {
      console.error("Error fetching eligible moderators:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch eligible moderators" 
      });
    }
  });

  // Get single group details
  app.get("/api/admin/groups/:id", requireAdminAuth, async (req, res) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Grupo não encontrado"
        });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch group" 
      });
    }
  });

  // Update group
  app.put("/api/admin/groups/:id", requireAdminAuth, async (req, res) => {
    try {
      const groupId = req.params.id;
      const updateData = req.body;
      
      // If moderator is being changed, validate they are pleno/senior level
      if (updateData.moderatorId) {
        const moderator = await storage.getUserById(updateData.moderatorId);
        if (!moderator || !['Pleno', 'Sênior', 'Honra', 'Diretivo'].includes(moderator.planName || '')) {
          return res.status(400).json({
            success: false,
            message: "Moderador deve ser do nível Pleno, Sênior, Honra ou Diretivo"
          });
        }
      }

      const updatedGroup = await storage.updateGroup(groupId, updateData);
      
      if (!updatedGroup) {
        return res.status(404).json({
          success: false,
          message: "Grupo não encontrado"
        });
      }

      res.json({
        success: true,
        message: "Grupo atualizado com sucesso",
        group: updatedGroup
      });
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update group" 
      });
    }
  });

  // Delete group (soft delete)
  app.delete("/api/admin/groups/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deleteGroup(req.params.id);
      res.json({
        success: true,
        message: "Grupo excluído com sucesso"
      });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete group" 
      });
    }
  });

  // Groups routes for members (authenticated users)
  
  // Get all active groups for members
  app.get("/api/groups", isAuthenticated, async (req, res) => {
    try {
      const groups = await storage.getAllActiveGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch groups" 
      });
    }
  });

  // Get specific group details
  app.get("/api/groups/:groupId", isAuthenticated, async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const group = await storage.getGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Grupo não encontrado"
        });
      }

      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch group" 
      });
    }
  });

  // Request to join a group
  app.post("/api/groups/:groupId/join", isAuthenticated, async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.user.id;
      
      // Check if user is eligible to join groups (not Público level)
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }

      // Check if group exists first
      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Grupo não encontrado"
        });
      }

      // For private groups, only Junior, Pleno, Sênior, Honra, and Diretivo can join
      if (!group.isPublic) {
        const eligiblePlans = ['Junior', 'Pleno', 'Sênior', 'Honra', 'Diretivo'];
        if (!eligiblePlans.includes(user.planName || '')) {
          return res.status(403).json({
            success: false,
            message: "Apenas membros Junior, Pleno, Sênior, Honra e Diretivo podem solicitar acesso a grupos privados"
          });
        }
      }
      // Public groups are accessible to all users

      // Check if user is already a member
      const existingMembership = await storage.getGroupMembership(groupId, userId);
      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: "Você já é membro deste grupo"
        });
      }

      // Add user to group
      await storage.joinGroup(groupId, userId);

      res.json({
        success: true,
        message: "Solicitação de acesso enviada com sucesso"
      });
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to join group" 
      });
    }
  });

  // Get user's group memberships
  app.get("/api/groups/my-memberships", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const memberships = await storage.getUserGroupMemberships(userId);
      res.json(memberships);
    } catch (error) {
      console.error("Error fetching user memberships:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch memberships" 
      });
    }
  });

  // Get specific group membership status
  app.get("/api/groups/:groupId/membership", isAuthenticated, async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.user.id;
      
      const membership = await storage.getGroupMembership(groupId, userId);
      res.json(membership || null);
    } catch (error) {
      console.error("Error fetching group membership:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch membership" 
      });
    }
  });

  // Leave group
  app.post("/api/groups/:groupId/leave", isAuthenticated, async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.user.id;
      
      const membership = await storage.getGroupMembership(groupId, userId);
      if (!membership) {
        return res.status(404).json({
          success: false,
          message: "Você não é membro deste grupo"
        });
      }
      
      const left = await storage.leaveGroup(groupId, userId);
      if (!left) {
        return res.status(500).json({
          success: false,
          message: "Erro ao sair do grupo"
        });
      }
      
      res.json({
        success: true,
        message: "Você saiu do grupo com sucesso"
      });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to leave group" 
      });
    }
  });

  // Group moderation routes (for moderators)
  
  // Get pending group requests (moderator only)
  app.get("/api/groups/:groupId/pending-requests", isAuthenticated, async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.user.id;
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem ver solicitações pendentes"
        });
      }
      
      const pendingRequests = await storage.getPendingGroupRequests(groupId);
      res.json(pendingRequests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch pending requests" 
      });
    }
  });

  // Approve group membership request (moderator only)
  app.post("/api/groups/:groupId/approve-request/:requestId", isAuthenticated, async (req, res) => {
    try {
      const { groupId, requestId } = req.params;
      const userId = req.user.id;
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem aprovar solicitações"
        });
      }
      
      const approved = await storage.approveGroupRequest(requestId);
      if (!approved) {
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada"
        });
      }
      
      res.json({
        success: true,
        message: "Solicitação aprovada com sucesso"
      });
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to approve request" 
      });
    }
  });

  // Reject group membership request (moderator only)
  app.post("/api/groups/:groupId/reject-request/:requestId", isAuthenticated, async (req, res) => {
    try {
      const { groupId, requestId } = req.params;
      const userId = req.user.id;
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem rejeitar solicitações"
        });
      }
      
      const rejected = await storage.rejectGroupRequest(requestId);
      if (!rejected) {
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada"
        });
      }
      
      res.json({
        success: true,
        message: "Solicitação rejeitada"
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to reject request" 
      });
    }
  });

  // Group posts routes
  
  // Get group posts (members can view, only moderators can post)
  app.get("/api/groups/:groupId/posts", isAuthenticated, async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.user.id;
      
      // Check if user is member of this group
      const membership = await storage.getGroupMembership(groupId, userId);
      if (!membership || !membership.isActive || membership.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro aprovado para ver as publicações"
        });
      }
      
      const posts = await storage.getGroupPosts(groupId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching group posts:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch posts" 
      });
    }
  });

  // Create group post (moderator only)
  app.post("/api/groups/:groupId/posts", isAuthenticated, async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.user.id;
      const { content, mediaType, mediaUrl } = req.body;
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem publicar no feed do grupo"
        });
      }
      
      const post = await storage.createGroupPost({
        groupId,
        authorId: userId,
        content,
        mediaType: mediaType || 'text',
        mediaUrl
      });
      
      res.json({
        success: true,
        message: "Publicação criada com sucesso",
        post
      });
    } catch (error) {
      console.error("Error creating group post:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create post" 
      });
    }
  });

  // Delete group post (moderator only)
  app.delete("/api/groups/:groupId/posts/:postId", isAuthenticated, async (req, res) => {
    try {
      const { groupId, postId } = req.params;
      const userId = req.user.id;
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem excluir publicações"
        });
      }
      
      const deleted = await storage.deleteGroupPost(postId, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Publicação não encontrada"
        });
      }
      
      res.json({
        success: true,
        message: "Publicação excluída com sucesso"
      });
    } catch (error) {
      console.error("Error deleting group post:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete post" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
