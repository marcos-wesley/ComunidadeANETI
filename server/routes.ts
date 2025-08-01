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

  const httpServer = createServer(app);
  return httpServer;
}
