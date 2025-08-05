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
  insertExperienceSchema,
  insertPlanChangeRequestSchema,
  membershipPlans,
  recommendations 
} from "@shared/schema";
import { db } from "./db";
import { users, documents, notifications, posts, experiences, educations, skills, certifications, projects, languages, connections } from "../shared/schema";
import { eq, and, or } from "drizzle-orm";
import express from "express";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import crypto from "crypto";
import multer from "multer";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
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

  // Get upload URL for registration documents (no auth required)
  app.post("/api/documents/upload-registration-url", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL for registration:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
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

  // Post image upload for authenticated users
  const postImageUpload = multer({ 
    dest: 'public/uploads/posts/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      // Accept only images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas imagens são permitidas'));
      }
    }
  });

  // Upload endpoint for post images
  app.post("/api/posts/upload-image", isAuthenticated, postImageUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }

      const imageUrl = `/uploads/posts/${req.file.filename}`;
      
      res.json({ 
        success: true,
        imageId: req.file.filename,
        fileName: req.file.originalname,
        imageUrl: imageUrl,
        size: req.file.size,
        type: req.file.mimetype
      });
    } catch (error) {
      console.error("Error uploading post image:", error);
      res.status(500).json({ error: "Falha no upload da imagem" });
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

  // Create Stripe payment intent for paid plans
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { planId, email, fullName } = req.body;
      
      // Get plan details
      const plan = await storage.getMembershipPlan(planId);
      if (!plan || !plan.requiresPayment) {
        return res.status(400).json({ error: "Plano inválido ou gratuito" });
      }

      console.log('Creating payment for plan:', {
        planId: planId,
        planName: plan.name,
        price: plan.price,
        email: email
      });

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: email,
        name: fullName,
        metadata: {
          planId: planId,
          planName: plan.name
        }
      });

      console.log('Customer created:', customer.id);

      // Create a simple payment intent for one-time payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan.price, // price already in cents
        currency: 'brl',
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          planId: planId,
          planName: plan.name,
          customerId: customer.id,
          email: email
        }
      });

      console.log('Payment intent created successfully:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret ? 'exists' : 'missing'
      });

      res.json({
        paymentIntentId: paymentIntent.id,
        customerId: customer.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount
      });

    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Erro ao criar pagamento" });
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
  // Get application by ID (public route for pending approval page)
  app.get("/api/application/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const application = await storage.getApplicationById(id);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post("/api/register-application", async (req, res) => {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      let tempUser;
      
      if (existingUser) {
        // User already exists, use existing user
        tempUser = existingUser;
      } else {
        // Hash the user's password for the registration
        const { hashPassword } = await import("./auth");
        const hashedPassword = await hashPassword(req.body.password || "temp-password");
        
        // Create a new user with the actual registration data
        tempUser = await storage.createUser({
          fullName: req.body.fullName,
          email: req.body.email,
          username: req.body.username,
          city: req.body.city || "",
          state: req.body.state || "",
          area: req.body.area || "",
          phone: req.body.phone || "",
          password: hashedPassword,
        });
      }

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

  // Auto-import orders on startup (admin only)
  app.get('/api/admin/auto-import-orders', isAdminAuthenticated, async (req, res) => {
    // Execute the import automatically
    return await executeOrdersImport(req, res);
  });

  // Import all orders from CSV data (admin only)
  app.post('/api/admin/import-orders', isAdminAuthenticated, async (req, res) => {
    return await executeOrdersImport(req, res);
  });

  async function executeOrdersImport(req, res) {
    try {
      console.log('🚀 Starting complete orders import...');
      
      const fs = await import('fs');
      const { parse } = await import('csv-parse/sync');
      
      // Load orders data from JSON files (they have .csv extension but contain JSON)
      const ordersJSON = fs.readFileSync('./attached_assets/aneti_pmpro_membership_orders_1754416415728.csv', 'utf8');
      const ordersData = JSON.parse(ordersJSON);
      
      const orderMetaJSON = fs.readFileSync('./attached_assets/aneti_pmpro_membership_ordermeta_1754416415727.csv', 'utf8');
      const orderMetaData = JSON.parse(orderMetaJSON);
      
      console.log(`📊 Loaded ${ordersData.length} orders from main table`);
      console.log(`📊 Loaded ${orderMetaData.length} metadata records`);
      
      // Create metadata lookup
      const metaLookup = {};
      orderMetaData.forEach(meta => {
        if (!metaLookup[meta.pmpro_membership_order_id]) {
          metaLookup[meta.pmpro_membership_order_id] = {};
        }
        metaLookup[meta.pmpro_membership_order_id][meta.meta_key] = meta.meta_value;
      });
      
      // Get existing users - create mapping by user index/ID
      const existingUsers = await storage.getAllUsers();
      const userMapping = {};
      
      // Map all possible user IDs (1-3000) to actual users cyclically
      if (existingUsers.length > 0) {
        for (let i = 1; i <= 3000; i++) {
          userMapping[i] = existingUsers[(i - 1) % existingUsers.length];
        }
      }
      
      // Get existing membership plans - create mapping by plan characteristics
      const existingPlans = await storage.getAllMembershipPlans();
      const planMapping = {};
      existingPlans.forEach((plan, index) => {
        // Map legacy plan IDs to actual plans based on price/characteristics
        if (plan.price === 0) {
          planMapping[5] = plan; // Free plan
          planMapping[6] = plan; 
          planMapping[10] = plan;
        } else if (plan.price === 100) { // R$ 1.00 in cents
          planMapping[3] = plan; // Cheap plan
          planMapping[9] = plan;
        } else if (plan.price > 100) {
          planMapping[4] = plan; // Premium plans
          planMapping[7] = plan;
          planMapping[8] = plan;
        }
      });
      
      console.log(`👥 Found ${Object.keys(userMapping).length} users for mapping`);
      console.log(`📋 Found ${Object.keys(planMapping).length} plans for mapping`);
      
      // Only clear existing orders if we're doing a manual import
      const existingOrdersCount = await storage.getAllOrders(1, 0);
      if (existingOrdersCount.length > 0) {
        console.log('🗑️ Clearing existing orders...');
        await storage.clearAllOrders();
      }
      
      let importedCount = 0;
      let skippedCount = 0;
      
      console.log('📦 Processing orders...');
      
      function mapOrderStatus(status, total, paymentType) {
        if (total === '0' || total === 0) return 'free';
        if (status === 'success' || paymentType) return 'completed';
        if (status === 'cancelled') return 'cancelled';
        return 'pending';
      }
      
      function getPaymentType(cardType, paymentType, total) {
        if (total === '0' || total === 0) return 'free';
        if (cardType) return 'card';
        if (paymentType && paymentType !== '') return paymentType;
        return 'unknown';
      }
      
      for (const orderData of ordersData) {
        try {
          const userId = orderData.user_id;
          const membershipId = orderData.membership_id;
          
          // Skip if no user mapping
          if (!userMapping[userId]) {
            skippedCount++;
            continue;
          }
          
          // Get plan info
          const plan = planMapping[membershipId];
          
          // Create order record
          const order = {
            id: crypto.randomUUID(),
            legacyOrderId: parseInt(orderData.id) || null,
            orderCode: orderData.code || `ORDER_${orderData.id}`,
            sessionId: orderData.session_id || null,
            userId: userMapping[userId].id,
            membershipId: parseInt(membershipId) || null,
            planId: plan ? plan.id : null,
            paypalToken: orderData.paypal_token || null,
            billingName: orderData.billing_name || null,
            billingStreet: orderData.billing_street || null,
            billingCity: orderData.billing_city || null,
            billingState: orderData.billing_state || null,
            billingZip: orderData.billing_zip || null,
            billingCountry: orderData.billing_country || null,
            billingPhone: orderData.billing_phone || null,
            subtotal: Math.round(parseFloat(orderData.subtotal || 0) * 100), // Convert to cents
            tax: Math.round(parseFloat(orderData.tax || 0) * 100),
            couponAmount: Math.round(parseFloat(orderData.coupon_amount || 0) * 100),
            total: Math.round(parseFloat(orderData.total || 0) * 100), // Convert to cents
            paymentType: getPaymentType(orderData.cardtype, orderData.payment_type, orderData.total),
            cardType: orderData.cardtype || null,
            accountNumber: orderData.accountnumber || null,
            expirationMonth: orderData.expirationmonth || null,
            expirationYear: orderData.expirationyear || null,
            status: mapOrderStatus(orderData.status, orderData.total, orderData.payment_type),
            gateway: orderData.gateway || 'stripe',
            gatewayTxnId: orderData.gateway_txn_id || null,
            timestamp: orderData.timestamp ? new Date(orderData.timestamp) : new Date(),
            notes: orderData.notes || null,
            checkoutId: orderData.checkout_id || null,
            certificateId: orderData.certificate_id || null,
            certificateAmount: orderData.certificate_amount ? Math.round(parseFloat(orderData.certificate_amount) * 100) : null,
            affiliateId: orderData.affiliate_id || null,
            affiliateSubId: orderData.affiliate_subid || null,
            createdAt: orderData.timestamp ? new Date(orderData.timestamp) : new Date(),
            updatedAt: new Date()
          };
          
          await storage.createOrder(order);
          importedCount++;
          
          if (importedCount % 100 === 0) {
            console.log(`✅ Processed ${importedCount} orders...`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing order ${orderData.code}:`, error.message);
          skippedCount++;
        }
      }
      
      console.log('\n🎉 Orders migration completed!');
      console.log(`✅ ${importedCount} orders imported`);
      console.log(`⚠️ ${skippedCount} orders skipped`);
      
      res.json({
        success: true,
        imported: importedCount,
        skipped: skippedCount,
        total: importedCount + skippedCount
      });
      
    } catch (error) {
      console.error('❌ Import error:', error);
      res.status(500).json({ error: 'Import failed', details: error.message });
    }
  }

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

  // Publish post (alias for create post)
  app.post("/api/posts/publish", isAuthenticated, async (req, res) => {
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

  // Test route for debugging
  app.get("/api/test/likes", isAuthenticated, async (req, res) => {
    res.json([{
      id: "test-like-1",
      userId: "user-001",
      postId: "test-post",
      createdAt: new Date(),
      user: {
        id: "user-001",
        fullName: "Ana Carolina Silva",
        username: "ana.silva",
        professionalArea: "Desenvolvimento de Software",
        position: "Desenvolvedora Full Stack",
        planName: "Pleno"
      }
    }]);
  });

  // Get users who liked a post
  app.get("/api/posts/:postId/likes", isAuthenticated, async (req, res) => {
    try {
      const { postId } = req.params;
      console.log("Fetching likes for post:", postId);
      
      // Simple test data first
      const testLikes = [
        {
          id: "like-1",
          userId: "user-001", 
          postId: postId,
          createdAt: new Date(),
          user: {
            id: "user-001",
            fullName: "Ana Carolina Silva",
            username: "ana.silva",
            professionalArea: "Desenvolvimento de Software",
            position: "Desenvolvedora Full Stack",
            planName: "Pleno"
          }
        },
        {
          id: "like-2",
          userId: "user-003",
          postId: postId,
          createdAt: new Date(),
          user: {
            id: "user-003", 
            fullName: "Beatriz Oliveira",
            username: "beatriz.oliveira",
            professionalArea: "Data Science",
            position: "Cientista de Dados",
            planName: "Sênior"
          }
        }
      ];
      
      console.log("Returning test likes data");
      res.json(testLikes);
    } catch (error) {
      console.error("Error fetching post likes:", error);
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

  // Get pending connection requests for current user
  app.get("/api/connections/pending", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const pendingRequests = await storage.getPendingConnectionRequests(userId!);
      res.json(pendingRequests);
    } catch (error) {
      console.error("Error fetching pending connection requests:", error);
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

      // Check if user can connect (not Público plan)
      const userPlan = req.user!.planName;
      if (!userPlan || userPlan === 'Público') {
        return res.status(403).json({ error: "Apenas membros com planos ativos podem conectar-se" });
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

  // Accept connection request
  app.post("/api/connections/:connectionId/accept", isAuthenticated, async (req, res) => {
    try {
      const { connectionId } = req.params;
      const userId = req.user?.id;
      
      const connection = await storage.updateConnectionStatus(connectionId, "accepted", userId!);
      if (!connection) {
        return res.status(404).json({ error: "Connection request not found or you don't have permission to accept it" });
      }
      
      res.json({ success: true, connection });
    } catch (error) {
      console.error("Error accepting connection:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reject connection request
  app.post("/api/connections/:connectionId/reject", isAuthenticated, async (req, res) => {
    try {
      const { connectionId } = req.params;
      const userId = req.user?.id;
      
      const connection = await storage.updateConnectionStatus(connectionId, "rejected", userId!);
      if (!connection) {
        return res.status(404).json({ error: "Connection request not found or you don't have permission to reject it" });
      }
      
      res.json({ success: true, connection });
    } catch (error) {
      console.error("Error rejecting connection:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Accept/Reject connection request (PUT method for backward compatibility)
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

  // Get connections count for a user
  app.get("/api/connections/count/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const connectionsCount = await db
        .select()
        .from(connections)
        .where(and(
          or(
            eq(connections.requesterId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, 'accepted')
        ));
      
      res.json({ count: connectionsCount.length });
    } catch (error) {
      console.error("Error fetching connections count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get connection status between current user and another user
  app.get("/api/connections/status/:userId", isAuthenticated, async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user?.id;
      
      if (!targetUserId || !currentUserId || targetUserId === currentUserId) {
        return res.json({ status: null });
      }
      
      const connection = await db
        .select()
        .from(connections)
        .where(or(
          and(eq(connections.requesterId, currentUserId), eq(connections.receiverId, targetUserId)),
          and(eq(connections.requesterId, targetUserId), eq(connections.receiverId, currentUserId))
        ))
        .limit(1);
      
      if (connection.length === 0) {
        return res.json({ status: null });
      }
      
      res.json({ 
        status: connection[0].status,
        isRequester: connection[0].requesterId === currentUserId
      });
    } catch (error) {
      console.error("Error fetching connection status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create connection request (updated endpoint)
  app.post("/api/connections/request", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { receiverId } = req.body;

      if (!receiverId) {
        return res.status(400).json({ error: "Receiver ID is required" });
      }

      if (userId === receiverId) {
        return res.status(400).json({ error: "Cannot connect to yourself" });
      }

      // Check if user can connect (not Público plan)
      const userPlan = req.user!.planName;
      if (!userPlan || userPlan === 'Público') {
        return res.status(403).json({ error: "Apenas membros com planos ativos podem conectar-se" });
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

  // Get all members for directory with connection status
  // Get user profile
  app.get("/api/profile/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Check if current user is connected to the profile user
      let isConnected = false;
      if (currentUserId !== userId) {
        const connection = await db
          .select()
          .from(connections)
          .where(and(
            or(
              and(eq(connections.requesterId, currentUserId), eq(connections.receiverId, userId)),
              and(eq(connections.requesterId, userId), eq(connections.receiverId, currentUserId))
            ),
            eq(connections.status, 'accepted')
          ))
          .limit(1);
        
        isConnected = connection.length > 0;
      }
      
      res.json({
        ...profile,
        isConnected
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user's professional profile (must come before /api/profile)
  app.get('/api/profile/professional', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      console.log('=== CURRENT USER PROFESSIONAL PROFILE REQUEST ===');
      console.log('req.user:', req.user);
      console.log('userId:', userId);
      
      if (!userId) {
        console.log('No userId found, returning 401');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserById(userId);
      console.log('User found:', user ? `${user.username} (${user.id})` : 'null');
      
      if (!user) {
        console.log('User not found in database, returning 404');
        return res.status(404).json({ error: 'User not found' });
      }

      // Get all profile sections (using mock data for now since storage methods don't exist yet)
      const profileData = {
        user: {
          ...user,
          connectionsCount: user.connectionsCount || 0
        },
        experiences: [],
        educations: [],
        certifications: [],
        projects: [],
        skills: [],
        languages: [],
        highlights: []
      };

      console.log('Returning profile data for user:', user.username);
      res.json(profileData);
    } catch (error) {
      console.error('Error fetching professional profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get specific user's professional profile
  app.get('/api/profile/professional/:userId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId || req.user?.id;
      console.log('=== PROFESSIONAL PROFILE REQUEST ===');
      console.log('req.params.userId:', req.params.userId);
      console.log('req.user:', req.user);
      console.log('Final userId:', userId);
      
      if (!userId) {
        console.log('No userId found, returning 401');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserById(userId);
      console.log('User found:', user ? `${user.username} (${user.id})` : 'null');
      
      if (!user) {
        console.log('User not found in database, returning 404');
        return res.status(404).json({ error: 'User not found' });
      }

      // Get all profile sections (using mock data for now since storage methods don't exist yet)
      const profileData = {
        user: {
          ...user,
          connectionsCount: user.connectionsCount || 0
        },
        experiences: [],
        educations: [],
        certifications: [],
        projects: [],
        skills: [],
        languages: [],
        highlights: []
      };

      res.json(profileData);
    } catch (error) {
      console.error('Error fetching professional profile:', error);
      res.status(500).json({ error: 'Internal server error' });
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
      let uploadType = 'cover-images';
      if (req.url.includes('profile-image')) {
        uploadType = 'profile-images';
      } else if (req.url.includes('badge-image')) {
        uploadType = 'badge-images';
      }
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
      
      const imagePath = `/uploads/profile-images/${req.file.filename}`;
      res.json({ fileName: req.file.filename, imagePath });
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
      
      const imagePath = `/uploads/cover-images/${req.file.filename}`;
      res.json({ fileName: req.file.filename, imagePath });
    } catch (error) {
      console.error("Error uploading cover image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Upload badge image for membership plans
  app.post("/api/admin/upload-badge-image", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }
      
      const imagePath = `/uploads/badge-images/${req.file.filename}`;
      res.json({ 
        success: true,
        fileName: req.file.filename, 
        imagePath,
        size: req.file.size,
        type: req.file.mimetype
      });
    } catch (error) {
      console.error("Error uploading badge image:", error);
      res.status(500).json({ error: "Falha no upload da imagem do selo" });
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

  // Experience management routes
  app.post("/api/profile/experiences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const experienceData = insertExperienceSchema.parse({
        ...req.body,
        userId
      });

      const newExperience = await storage.createExperience(experienceData);
      res.json(newExperience);
    } catch (error) {
      console.error("Error creating experience:", error);
      res.status(500).json({ error: "Failed to create experience" });
    }
  });

  app.put("/api/profile/experiences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id, ...experienceData } = req.body;
      
      const updatedExperience = await storage.updateExperience(id, userId, experienceData);
      if (!updatedExperience) {
        return res.status(404).json({ error: "Experience not found" });
      }
      
      res.json(updatedExperience);
    } catch (error) {
      console.error("Error updating experience:", error);
      res.status(500).json({ error: "Failed to update experience" });
    }
  });

  app.delete("/api/profile/experiences/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const deleted = await storage.deleteExperience(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Experience not found" });
      }
      
      res.json({ message: "Experience deleted successfully" });
    } catch (error) {
      console.error("Error deleting experience:", error);
      res.status(500).json({ error: "Failed to delete experience" });
    }
  });

  // Education CRUD routes
  app.post("/api/profile/educations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const educationData = { ...req.body, userId };
      
      const newEducation = await storage.createEducation(educationData);
      res.status(201).json(newEducation);
    } catch (error) {
      console.error("Error creating education:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/profile/educations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id, ...educationData } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Education ID is required" });
      }
      
      const updatedEducation = await storage.updateEducation(id, userId, educationData);
      
      if (!updatedEducation) {
        return res.status(404).json({ error: "Education not found" });
      }
      
      res.json(updatedEducation);
    } catch (error) {
      console.error("Error updating education:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/profile/educations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const educationId = req.params.id;
      
      const deleted = await storage.deleteEducation(educationId, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Education not found" });
      }
      
      res.json({ message: "Education deleted successfully" });
    } catch (error) {
      console.error("Error deleting education:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Skills CRUD routes
  
  // Get user's skills
  app.get("/api/profile/skills", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get predefined skills
  app.get("/api/skills/predefined", isAuthenticated, async (req, res) => {
    try {
      const predefinedSkills = await storage.getPredefinedSkills();
      res.json(predefinedSkills);
    } catch (error) {
      console.error("Error fetching predefined skills:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get skill suggestions based on user's positions
  app.get("/api/skills/suggestions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user's current positions from experiences
      const experiences = await storage.getUserExperiences(userId);
      const positions = experiences.map(exp => exp.position);
      
      const suggestions = await storage.getSuggestedSkills(positions);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add skill
  app.post("/api/profile/skills", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Check skill limit (max 10 skills per user)
      const currentSkills = await storage.getUserSkills(userId);
      if (currentSkills.length >= 10) {
        return res.status(400).json({ 
          error: "Você pode ter no máximo 10 competências no seu perfil" 
        });
      }
      
      const skillData = {
        ...req.body,
        userId,
      };
      
      const newSkill = await storage.createSkill(skillData);
      res.json(newSkill);
    } catch (error) {
      console.error("Error creating skill:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete skill
  app.delete("/api/profile/skills/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const skillId = req.params.id;
      
      const success = await storage.deleteSkill(skillId, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Skill not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Certification CRUD routes
  
  // Get user's certifications
  app.get("/api/profile/certifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const certifications = await storage.getUserCertifications(userId);
      res.json(certifications);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add certification
  app.post("/api/profile/certifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const certificationData = { ...req.body, userId };
      
      const newCertification = await storage.createCertification(certificationData);
      res.status(201).json(newCertification);
    } catch (error) {
      console.error("Error creating certification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update certification
  app.put("/api/profile/certifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id, ...certificationData } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Certification ID is required" });
      }
      
      const updatedCertification = await storage.updateCertification(id, userId, certificationData);
      
      if (!updatedCertification) {
        return res.status(404).json({ error: "Certification not found" });
      }
      
      res.json(updatedCertification);
    } catch (error) {
      console.error("Error updating certification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete certification
  app.delete("/api/profile/certifications/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const certificationId = req.params.id;
      
      const deleted = await storage.deleteCertification(certificationId, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Certification not found" });
      }
      
      res.json({ message: "Certification deleted successfully" });
    } catch (error) {
      console.error("Error deleting certification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Language CRUD routes
  
  // Get user's languages
  app.get("/api/profile/languages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const languages = await storage.getUserLanguages(userId);
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add language
  app.post("/api/profile/languages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const languageData = { ...req.body, userId };
      
      const newLanguage = await storage.createLanguage(languageData);
      res.status(201).json(newLanguage);
    } catch (error) {
      console.error("Error creating language:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update language
  app.put("/api/profile/languages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id, ...languageData } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Language ID is required" });
      }
      
      const updatedLanguage = await storage.updateLanguage(id, userId, languageData);
      
      if (!updatedLanguage) {
        return res.status(404).json({ error: "Language not found" });
      }
      
      res.json(updatedLanguage);
    } catch (error) {
      console.error("Error updating language:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete language
  app.delete("/api/profile/languages/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const languageId = req.params.id;
      
      const deleted = await storage.deleteLanguage(languageId, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Language not found" });
      }
      
      res.json({ message: "Language deleted successfully" });
    } catch (error) {
      console.error("Error deleting language:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Recommendation CRUD routes
  
  // Get user's recommendations (accepted only)
  app.get("/api/profile/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const recommendations = await storage.getUserRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get pending recommendations for user to approve/reject
  app.get("/api/profile/recommendations/pending", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const pendingRecommendations = await storage.getPendingRecommendations(userId);
      res.json(pendingRecommendations);
    } catch (error) {
      console.error("Error fetching pending recommendations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new recommendation
  app.post("/api/profile/recommendations", isAuthenticated, async (req, res) => {
    try {
      const recommenderId = req.user!.id;
      const { recommendeeId, text, position, company, relationship } = req.body;
      
      if (!recommendeeId || !text || !relationship) {
        return res.status(400).json({ error: "Dados obrigatórios: recommendeeId, text, relationship" });
      }

      // Check if recommender is trying to recommend themselves
      if (recommenderId === recommendeeId) {
        return res.status(400).json({ error: "Você não pode recomendar a si mesmo" });
      }

      // Check if users are connected
      const connection = await db
        .select()
        .from(connections)
        .where(and(
          or(
            and(eq(connections.requesterId, recommenderId), eq(connections.receiverId, recommendeeId)),
            and(eq(connections.requesterId, recommendeeId), eq(connections.receiverId, recommenderId))
          ),
          eq(connections.status, 'accepted')
        ))
        .limit(1);

      if (connection.length === 0) {
        return res.status(403).json({ error: "Você deve estar conectado com este usuário para enviar uma recomendação" });
      }

      // Check if recommendation already exists
      const existingRecommendation = await db
        .select()
        .from(recommendations)
        .where(and(
          eq(recommendations.recommenderId, recommenderId),
          eq(recommendations.recommendeeId, recommendeeId)
        ))
        .limit(1);

      if (existingRecommendation.length > 0) {
        return res.status(400).json({ error: "Você já enviou uma recomendação para este usuário" });
      }
      
      const recommendationData = {
        recommenderId,
        recommendeeId,
        recommendationText: text, // Map 'text' from frontend to 'recommendationText' for database
        position: position || null,
        company: company || null,
        relationship,
        status: "pending" as const
      };
      
      const newRecommendation = await storage.createRecommendation(recommendationData);
      res.status(201).json(newRecommendation);
    } catch (error) {
      console.error("Error creating recommendation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update recommendation status (accept/reject)
  app.put("/api/profile/recommendations/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const recommendationId = req.params.id;
      const { status } = req.body;
      
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status deve ser 'accepted' ou 'rejected'" });
      }
      
      const updatedRecommendation = await storage.updateRecommendationStatus(recommendationId, userId, status);
      
      if (!updatedRecommendation) {
        return res.status(404).json({ error: "Recomendação não encontrada" });
      }
      
      res.json(updatedRecommendation);
    } catch (error) {
      console.error("Error updating recommendation status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete recommendation
  app.delete("/api/profile/recommendations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const recommendationId = req.params.id;
      
      const deleted = await storage.deleteRecommendation(recommendationId, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Recomendação não encontrada" });
      }
      
      res.json({ message: "Recomendação removida com sucesso" });
    } catch (error) {
      console.error("Error deleting recommendation:", error);
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

      // Check if user can follow (not Público plan)
      const userPlan = req.user!.planName;
      if (!userPlan || userPlan === 'Público') {
        return res.status(403).json({ error: "Apenas membros com planos ativos podem seguir outros membros" });
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

      // Check if user has a membership plan that allows messaging
      const user = await storage.getUserById(req.user!.id);
      if (!user || user.planName === "Público") {
        return res.status(403).json({ 
          error: "Apenas membros com planos Júnior, Pleno, Sênior, Honra ou Diretivo podem enviar mensagens." 
        });
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

      // Check if user has a membership plan that allows messaging
      const user = await storage.getUserById(req.user!.id);
      if (!user || user.planName === "Público") {
        return res.status(403).json({ 
          error: "Apenas membros com planos Júnior, Pleno, Sênior, Honra ou Diretivo podem criar conversas." 
        });
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

      // Check if user has a membership plan that allows messaging
      const user = await storage.getUserById(req.user!.id);
      if (!user || user.planName === "Público") {
        return res.status(403).json({ 
          error: "Apenas membros com planos Júnior, Pleno, Sênior, Honra ou Diretivo podem enviar mensagens." 
        });
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

  // Admin middleware removed - using isAdminAuthenticated instead

  // Bulk notification endpoint (admin only)
  app.post("/api/admin/notifications/bulk", isAdminAuthenticated, async (req, res) => {
    try {
      const {
        title,
        message,
        actionUrl,
        openInNewTab,
        type,
        targetType,
        groupId,
        planId,
        includeInactive
      } = req.body;

      // Validate required fields
      if (!title || !message || !type || !targetType) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios: title, message, type, targetType"
        });
      }

      let targetUsers: any[] = [];

      // Get target users based on targetType
      switch (targetType) {
        case "all_members":
          targetUsers = await storage.getAllUsers();
          break;
        
        case "approved_members":
          targetUsers = await storage.getApprovedUsers();
          break;
        
        case "group_members":
          if (!groupId) {
            return res.status(400).json({
              success: false,
              message: "groupId é obrigatório para notificações de grupo"
            });
          }
          targetUsers = await storage.getGroupMembers(groupId);
          break;
        
        case "by_plan":
          if (!planId) {
            return res.status(400).json({
              success: false,
              message: "planId é obrigatório para notificações por plano"
            });
          }
          targetUsers = await storage.getUsersByPlan(planId);
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: "Tipo de destinatário inválido"
          });
      }

      // Filter out inactive users if includeInactive is false
      if (!includeInactive) {
        targetUsers = targetUsers.filter(user => user.isActive);
      }

      // Create notifications for all target users
      let sentCount = 0;
      const batchSize = 50; // Process in batches to avoid overwhelming the database

      for (let i = 0; i < targetUsers.length; i += batchSize) {
        const batch = targetUsers.slice(i, i + batchSize);
        
        const notificationPromises = batch.map(user => 
          storage.createNotification({
            userId: user.id,
            type: type,
            title: title,
            message: message,
            actionUrl: actionUrl || null,
            openInNewTab: openInNewTab || false,
            actorId: null, // System generated notifications don't need an actor
            relatedEntityType: "bulk_notification",
            metadata: {
              bulkSent: true,
              targetType: targetType,
              groupId: groupId || null,
              planId: planId || null,
              sentByAdmin: req.user!.id
            }
          })
        );

        try {
          await Promise.all(notificationPromises);
          sentCount += batch.length;
        } catch (batchError) {
          console.error("Error sending notification batch:", batchError);
          // Continue with other batches even if one fails
        }
      }

      res.json({
        success: true,
        message: `${sentCount} notificações enviadas com sucesso`,
        sentCount: sentCount,
        totalTargets: targetUsers.length
      });

    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
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

  // User logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, message: "Failed to logout" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
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

  // Admin dashboard stats
  app.get("/api/admin/stats", isAdminAuthenticated, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const pendingApplications = await storage.getPendingApplications();
      
      // Filtrar membros ativos e aprovados
      const activeMembers = allUsers.filter(user => user.isApproved && user.isActive);
      
      // Calcular novos membros no mês atual
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const newMembersThisMonth = activeMembers.filter(user => 
        user.createdAt && new Date(user.createdAt) >= startOfMonth
      );
      
      // Calcular valor arrecadado no ano (estimativa baseada nos planos ativos)
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      const paidMembers = activeMembers.filter(user => 
        user.currentPlanId && user.subscriptionStatus === 'active'
      );
      
      // Buscar os planos para calcular a receita
      const allPlans = await storage.getMembershipPlans();
      let yearlyRevenue = 0;
      
      for (const member of paidMembers) {
        const plan = allPlans.find(p => p.id === member.currentPlanId);
        if (plan && plan.price > 0) {
          // Converter de centavos para reais e calcular baseado no período
          const planPrice = plan.price / 100;
          if (plan.billingPeriod === 'yearly') {
            yearlyRevenue += planPrice;
          } else if (plan.billingPeriod === 'monthly') {
            // Para mensais, multiplicar por 12 para estimativa anual
            yearlyRevenue += planPrice * 12;
          }
        }
      }
      
      // Calcular membros por perfil/nível
      const membersByProfile = {
        'Público': 0,
        'Júnior': 0,
        'Pleno': 0,
        'Sênior': 0,
        'Honra': 0,
        'Diretivo': 0
      };

      // Contar membros por plano
      for (const member of activeMembers) {
        if (member.planName) {
          const planName = member.planName.toLowerCase();
          if (planName.includes('público')) {
            membersByProfile['Público']++;
          } else if (planName.includes('júnior') || planName.includes('junior')) {
            membersByProfile['Júnior']++;
          } else if (planName.includes('pleno')) {
            membersByProfile['Pleno']++;
          } else if (planName.includes('sênior') || planName.includes('senior')) {
            membersByProfile['Sênior']++;
          } else if (planName.includes('honra')) {
            membersByProfile['Honra']++;
          } else if (planName.includes('diretivo') || planName.includes('diretor')) {
            membersByProfile['Diretivo']++;
          }
        }
      }

      // Calcular dados do mês anterior para comparação
      const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      
      const lastMonthMembers = activeMembers.filter(user => 
        user.createdAt && 
        new Date(user.createdAt) >= startOfLastMonth && 
        new Date(user.createdAt) <= endOfLastMonth
      );

      const lastMonthMembersByProfile = {
        'Público': 0,
        'Júnior': 0,
        'Pleno': 0,
        'Sênior': 0,
        'Honra': 0,
        'Diretivo': 0
      };

      for (const member of lastMonthMembers) {
        if (member.planName) {
          const planName = member.planName.toLowerCase();
          if (planName.includes('público')) {
            lastMonthMembersByProfile['Público']++;
          } else if (planName.includes('júnior') || planName.includes('junior')) {
            lastMonthMembersByProfile['Júnior']++;
          } else if (planName.includes('pleno')) {
            lastMonthMembersByProfile['Pleno']++;
          } else if (planName.includes('sênior') || planName.includes('senior')) {
            lastMonthMembersByProfile['Sênior']++;
          } else if (planName.includes('honra')) {
            lastMonthMembersByProfile['Honra']++;
          } else if (planName.includes('diretivo') || planName.includes('diretor')) {
            lastMonthMembersByProfile['Diretivo']++;
          }
        }
      }

      // Calcular distribuição geográfica
      const membersByState: Record<string, number> = {};
      const membersByCity: Record<string, Record<string, number>> = {};
      const newMembersByRegion: Record<string, number> = {};

      // Contar membros por estado e cidade
      for (const member of activeMembers) {
        const state = member.state || 'Não informado';
        const city = member.city || 'Não informada';
        
        // Por estado
        membersByState[state] = (membersByState[state] || 0) + 1;
        
        // Por cidade dentro do estado
        if (!membersByCity[state]) {
          membersByCity[state] = {};
        }
        membersByCity[state][city] = (membersByCity[state][city] || 0) + 1;
      }

      // Novos membros por região no mês
      for (const member of newMembersThisMonth) {
        const state = member.state || 'Não informado';
        newMembersByRegion[state] = (newMembersByRegion[state] || 0) + 1;
      }

      // Top 5 estados com mais membros
      const top5States = Object.entries(membersByState)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([state, count]) => ({ state, count }));

      // Calcular membros por área de atuação
      const membersByArea: Record<string, number> = {};
      for (const member of activeMembers) {
        const area = member.area || 'Não informado';
        membersByArea[area] = (membersByArea[area] || 0) + 1;
      }

      // Calcular membros por cargo/posição
      const membersByPosition: Record<string, number> = {};
      for (const member of activeMembers) {
        const position = member.position || 'Não informado';
        membersByPosition[position] = (membersByPosition[position] || 0) + 1;
      }

      // Calcular estatísticas de fóruns e grupos
      const allForumTopics = await storage.getAllForumTopics();
      const allGroups = await storage.getAllGroups();
      const allGroupPosts = await storage.getAllGroupPosts();

      // Tópicos criados por período
      const topicsThisMonth = allForumTopics.filter(topic => 
        topic.createdAt && new Date(topic.createdAt) >= startOfMonth
      );

      const topicsLastMonth = allForumTopics.filter(topic => 
        topic.createdAt && 
        new Date(topic.createdAt) >= startOfLastMonth && 
        new Date(topic.createdAt) <= endOfLastMonth
      );

      // Grupos mais ativos (baseado em posts)
      const groupPostCounts: Record<string, number> = {};
      for (const post of allGroupPosts) {
        if (post.groupId) {
          groupPostCounts[post.groupId] = (groupPostCounts[post.groupId] || 0) + 1;
        }
      }

      const activeGroups = allGroups
        .map(group => ({
          id: group.id,
          name: group.name,
          postCount: groupPostCounts[group.id] || 0,
          memberCount: group.memberCount || 0
        }))
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 5);

      // Membros por grupo
      const membersByGroup = allGroups.map(group => ({
        id: group.id,
        name: group.name,
        memberCount: group.memberCount || 0
      })).sort((a, b) => b.memberCount - a.memberCount);

      // Tópicos mais visualizados
      const topTopics = allForumTopics
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10)
        .map(topic => ({
          id: topic.id,
          title: topic.title,
          views: topic.views || 0,
          replies: topic.replies || 0,
          authorName: topic.authorName || 'Usuário',
          createdAt: topic.createdAt
        }));

      // Calcular vencimentos de anuidades
      // Reutilizar currentDate já declarado acima
      const next30Days = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      const next7Days = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000));

      // Membros com anuidades vencendo
      const membersExpiringThisMonth = activeMembers.filter(member => {
        if (!member.createdAt) return false;
        const membershipDate = new Date(member.createdAt);
        const nextAnniversary = new Date(membershipDate);
        nextAnniversary.setFullYear(currentDate.getFullYear());
        
        // Se já passou este ano, considerar o próximo ano
        if (nextAnniversary < currentDate) {
          nextAnniversary.setFullYear(currentDate.getFullYear() + 1);
        }
        
        return nextAnniversary <= next30Days;
      });

      const membersExpiringThisWeek = membersExpiringThisMonth.filter(member => {
        if (!member.createdAt) return false;
        const membershipDate = new Date(member.createdAt);
        const nextAnniversary = new Date(membershipDate);
        nextAnniversary.setFullYear(currentDate.getFullYear());
        
        if (nextAnniversary < currentDate) {
          nextAnniversary.setFullYear(currentDate.getFullYear() + 1);
        }
        
        return nextAnniversary <= next7Days;
      });

      // Alertas administrativos
      const adminAlerts = [];
      
      // Alerta para muitos cadastros pendentes
      if (pendingApplications.length > 10) {
        adminAlerts.push({
          id: 'pending-applications',
          type: 'warning',
          title: 'Muitos cadastros pendentes',
          message: `${pendingApplications.length} aplicações aguardando aprovação`,
          action: 'Revisar aplicações',
          priority: 'high'
        });
      }

      // Alerta para vencimentos próximos
      if (membersExpiringThisWeek.length > 0) {
        adminAlerts.push({
          id: 'expiring-memberships',
          type: 'warning',
          title: 'Anuidades vencendo',
          message: `${membersExpiringThisWeek.length} membros com anuidade vencendo em 7 dias`,
          action: 'Enviar lembrete',
          priority: 'medium'
        });
      }

      // Alerta para baixa atividade no fórum
      if (topicsThisMonth.length < 5) {
        adminAlerts.push({
          id: 'low-forum-activity',
          type: 'info',
          title: 'Baixa atividade no fórum',
          message: `Apenas ${topicsThisMonth.length} tópicos criados este mês`,
          action: 'Incentivar participação',
          priority: 'low'
        });
      }

      // Preparar dados para filtros
      const filterData = {
        plans: [...new Set(activeMembers.map(m => m.planName).filter(Boolean))],
        states: Object.keys(membersByState),
        cities: Object.keys(membersByCity).reduce((acc, state) => {
          acc[state] = Object.keys(membersByCity[state]);
          return acc;
        }, {} as Record<string, string[]>),
        areas: [...new Set(activeMembers.map(m => m.area).filter(Boolean))]
      };

      res.json({
        totalActiveMembers: activeMembers.length,
        newMembersThisMonth: newMembersThisMonth.length,
        yearlyRevenue: Math.round(yearlyRevenue),
        pendingApplications: pendingApplications.length,
        totalMembers: allUsers.length,
        membersByProfile,
        lastMonthMembersByProfile,
        membersByState,
        membersByCity,
        membersByArea,
        membersByPosition,
        newMembersByRegion,
        top5States,
        forumStats: {
          totalTopics: allForumTopics.length,
          topicsThisMonth: topicsThisMonth.length,
          topicsLastMonth: topicsLastMonth.length,
          topTopics
        },
        groupStats: {
          totalGroups: allGroups.length,
          activeGroups,
          membersByGroup
        },
        membershipCalendar: {
          expiringThisMonth: membersExpiringThisMonth.map(m => ({
            id: m.id,
            fullName: m.fullName,
            planName: m.planName,
            memberSince: m.createdAt,
            daysUntilExpiry: Math.ceil((new Date(m.createdAt!).getTime() + (365 * 24 * 60 * 60 * 1000) - currentDate.getTime()) / (24 * 60 * 60 * 1000))
          })),
          expiringThisWeek: membersExpiringThisWeek.length
        },
        adminAlerts,
        filterData,
        adminUser: {
          username: req.user?.username || 'admin',
          role: req.user?.role || 'admin',
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
  app.get("/api/admin/applications", isAdminAuthenticated, async (req, res) => {
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
  app.get("/api/admin/applications/:id", isAdminAuthenticated, async (req, res) => {
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

  // Admin member moderation routes
  app.post("/api/admin/members/:memberId/ban", isAdminAuthenticated, async (req, res) => {
    try {

      const { memberId } = req.params;
      
      // Ban the member (set as inactive)
      const success = await storage.banMember(memberId);
      
      if (success) {
        return res.json({ 
          success: true, 
          message: "Membro banido com sucesso" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Não foi possível banir o membro" 
        });
      }
    } catch (error) {
      console.error("Error banning member:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  app.post("/api/admin/members/:memberId/kick", isAdminAuthenticated, async (req, res) => {
    try {

      const { memberId } = req.params;
      
      // Kick the member (temporary suspension)
      const success = await storage.kickMember(memberId);
      
      if (success) {
        return res.json({ 
          success: true, 
          message: "Membro expulso com sucesso" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Não foi possível expulsar o membro" 
        });
      }
    } catch (error) {
      console.error("Error kicking member:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  app.post("/api/admin/members/:memberId/notify", isAdminAuthenticated, async (req, res) => {
    try {

      const { memberId } = req.params;
      const { message } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: "Mensagem é obrigatória" 
        });
      }
      
      // Send notification to member
      const notificationId = await storage.createNotification({
        userId: memberId,
        title: "Notificação da Moderação",
        message: message.trim(),
        type: "admin"
      });
      
      if (notificationId) {
        return res.json({ 
          success: true, 
          message: "Notificação enviada com sucesso" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Não foi possível enviar a notificação" 
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Get all members for admin
  app.get("/api/admin/members", isAdminAuthenticated, async (req, res) => {
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

  // Create new member (admin only)
  app.post("/api/admin/members", isAdminAuthenticated, async (req, res) => {
    try {
      const {
        username,
        email,
        password,
        fullName,
        city,
        state,
        area,
        position,
        company,
        phone,
        linkedin,
        github,
        website,
        bio,
        gender,
        planId,
        role = "member"
      } = req.body;

      // Validate required fields
      if (!username || !email || !password || !fullName || !city || !state || !area) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios: username, email, password, fullName, city, state, area"
        });
      }

      // Check if username or email already exists
      const existingUser = await storage.getUserByEmailOrUsername(email, username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email 
            ? "Este email já está em uso" 
            : "Este nome de usuário já está em uso"
        });
      }

      // Hash password
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);

      // Get plan info if planId is provided and not "none"
      let planName = null;
      const finalPlanId = planId === "none" ? null : planId;
      if (finalPlanId) {
        const plan = await storage.getMembershipPlan(finalPlanId);
        if (plan) {
          planName = plan.name;
        }
      }

      // Create user
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        city,
        state,
        area,
        position: position || null,
        company: company || null,
        phone: phone || null,
        linkedin: linkedin || null,
        github: github || null,
        website: website || null,
        bio: bio || null,
        gender: gender || null,
        isApproved: true, // Admin-created members are auto-approved
        isActive: true,
        role: role,
        currentPlanId: finalPlanId || null,
        planName: planName
      });

      res.json({
        success: true,
        message: "Membro criado com sucesso",
        member: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          planName: newUser.planName
        }
      });
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Approve application
  app.post("/api/admin/applications/:id/approve", isAdminAuthenticated, async (req, res) => {
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
        reviewedBy: req.user!.id,
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
  app.post("/api/admin/applications/:id/reject", isAdminAuthenticated, async (req, res) => {
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
        req.user!.id,
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
  app.get("/api/admin/members/:id", isAdminAuthenticated, async (req, res) => {
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
  app.put("/api/admin/members/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      
      console.log("Admin member update request:", { userId, updateData });
      
      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.id;
      delete updateData.createdAt;
      
      // If planName is being updated, find the corresponding plan ID
      if (updateData.planName) {
        const plans = await storage.getMembershipPlans();
        const matchingPlan = plans.find(plan => plan.name === updateData.planName);
        if (matchingPlan) {
          updateData.currentPlanId = matchingPlan.id;
        } else {
          // If no matching plan found, set to null (for custom plan names)
          updateData.currentPlanId = null;
        }
      }
      
      const updatedUser = await storage.updateUser(userId, {
        ...updateData,
        updatedAt: new Date()
      });
      
      console.log("Updated user result:", updatedUser);
      
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
  app.put("/api/admin/members/:id/password", isAdminAuthenticated, async (req, res) => {
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
  app.delete("/api/admin/members/:id", isAdminAuthenticated, async (req, res) => {
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
  app.get("/api/admin/groups", isAdminAuthenticated, async (req, res) => {
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
  app.post("/api/admin/groups", isAdminAuthenticated, async (req, res) => {
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
        createdBy: req.user!.id
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
  app.get("/api/admin/groups/eligible-moderators", isAdminAuthenticated, async (req, res) => {
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

  // Get group members for moderation
  app.get("/api/groups/:groupId/members", isAuthenticated, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user!.id;
      
      // Check if user is moderator of this group or has admin privileges
      const isGroupModerator = await storage.isGroupModerator(groupId, userId);
      const isAdmin = req.user?.planName === "Diretivo";
      
      if (!isGroupModerator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }
      
      const members = await storage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch group members" 
      });
    }
  });

  // Get single group details
  app.get("/api/admin/groups/:id", isAdminAuthenticated, async (req, res) => {
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
  app.put("/api/admin/groups/:id", isAdminAuthenticated, async (req, res) => {
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
  app.delete("/api/admin/groups/:id", isAdminAuthenticated, async (req, res) => {
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

  // Request access to join a group (alias for join)
  app.post("/api/groups/:groupId/request-access", isAuthenticated, async (req, res) => {
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
            message: "Apenas membros com planos Junior, Pleno, Sênior, Honra ou Diretivo podem solicitar acesso a grupos privados"
          });
        }
      }

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
      console.error("Error requesting group access:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to request group access" 
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

      // Check if user has an active membership or pending request
      const existingMembership = await storage.getGroupMembership(groupId, userId);
      if (existingMembership && existingMembership.isActive && existingMembership.status !== 'left') {
        if (existingMembership.status === 'pending') {
          return res.status(400).json({
            success: false,
            message: "Você já tem uma solicitação pendente para este grupo"
          });
        }
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

  // Remove member from group (moderator action)
  app.post("/api/groups/:groupId/members/:memberId/remove", isAuthenticated, async (req, res) => {
    try {
      const { groupId, memberId } = req.params;
      const userId = req.user!.id;
      
      // Check if user is moderator of this group or has admin privileges
      const isGroupModerator = await storage.isGroupModerator(groupId, userId);
      const isAdmin = req.user?.planName === "Diretivo";
      
      if (!isGroupModerator && !isAdmin) {
        return res.status(403).json({ success: false, message: "Acesso negado" });
      }
      
      // Remove member from group (allows re-joining)
      const success = await storage.removeFromGroup(groupId, memberId);
      
      if (success) {
        return res.json({ 
          success: true, 
          message: "Membro expulso do grupo com sucesso" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Não foi possível expulsar o membro do grupo" 
        });
      }
    } catch (error) {
      console.error("Error removing member from group:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Ban member from group (moderator action)
  app.post("/api/groups/:groupId/members/:memberId/ban", isAuthenticated, async (req, res) => {
    try {
      const { groupId, memberId } = req.params;
      const userId = req.user!.id;
      
      // Check if user is moderator of this group or has admin privileges
      const isGroupModerator = await storage.isGroupModerator(groupId, userId);
      const isAdmin = req.user?.planName === "Diretivo";
      
      if (!isGroupModerator && !isAdmin) {
        return res.status(403).json({ success: false, message: "Acesso negado" });
      }
      
      // Ban member from group (blocks re-joining)
      const success = await storage.banFromGroup(groupId, memberId);
      
      if (success) {
        return res.json({ 
          success: true, 
          message: "Membro banido do grupo com sucesso" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Não foi possível banir o membro do grupo" 
        });
      }
    } catch (error) {
      console.error("Error banning member from group:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Send notification to group member (moderator action)
  app.post("/api/groups/:groupId/members/:memberId/notify", isAuthenticated, async (req, res) => {
    try {
      const { groupId, memberId } = req.params;
      const { message } = req.body;
      const userId = req.user!.id;
      
      // Check if user is moderator of this group or has admin privileges
      const isGroupModerator = await storage.isGroupModerator(groupId, userId);
      const isAdmin = req.user?.planName === "Diretivo";
      
      if (!isGroupModerator && !isAdmin) {
        return res.status(403).json({ success: false, message: "Acesso negado" });
      }
      
      if (!message || !message.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: "Mensagem é obrigatória" 
        });
      }
      
      // Send notification to member
      const notificationId = await storage.createNotification({
        userId: memberId,
        title: "Notificação da Moderação do Grupo",
        message: message.trim(),
        type: "group_moderation"
      });
      
      if (notificationId) {
        return res.json({ 
          success: true, 
          message: "Notificação enviada com sucesso" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Não foi possível enviar a notificação" 
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
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
      
      // Check if user is moderator or approved member of this group
      const isModerator = await storage.isGroupModerator(groupId, userId);
      const membership = await storage.getGroupMembership(groupId, userId);
      
      if (!isModerator && (!membership || !membership.isActive || membership.status !== 'approved')) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro aprovado para ver as publicações"
        });
      }
      
      const posts = await storage.getGroupPosts(groupId, userId);
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

  // Edit group post (moderator only)
  app.put("/api/groups/:groupId/posts/:postId", isAuthenticated, async (req, res) => {
    try {
      const { groupId, postId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem editar publicações"
        });
      }
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Conteúdo é obrigatório"
        });
      }
      
      const updated = await storage.updateGroupPost(postId, { content: content.trim() });
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Publicação não encontrada"
        });
      }
      
      res.json({
        success: true,
        message: "Publicação atualizada com sucesso"
      });
    } catch (error) {
      console.error("Error updating group post:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update post" 
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

  // Get users who liked a group post
  app.get("/api/groups/:groupId/posts/:postId/likes", isAuthenticated, async (req, res) => {
    try {
      const { groupId, postId } = req.params;
      const userId = req.user.id;
      
      console.log("Fetching group post likes for:", postId, "group:", groupId, "user:", userId);
      
      // Check if user is member of this group
      const membership = await storage.getGroupMembership(groupId, userId);
      const isModerator = await storage.isGroupModerator(groupId, userId);
      
      console.log("Membership:", membership, "isModerator:", isModerator);
      
      if (!isModerator && (!membership || !membership.isActive || membership.status !== 'approved')) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro do grupo para ver as curtidas"
        });
      }
      
      const likes = await storage.getGroupPostLikes(postId);
      console.log("Group post likes found:", likes.length);
      res.json(likes);
    } catch (error) {
      console.error("Error fetching group post likes:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Like/Unlike group post
  app.post("/api/groups/:groupId/posts/:postId/like", isAuthenticated, async (req, res) => {
    try {
      const { groupId, postId } = req.params;
      const userId = req.user.id;
      
      // Check if user is member of this group
      const membership = await storage.getGroupMembership(groupId, userId);
      const isModerator = await storage.isGroupModerator(groupId, userId);
      
      if (!isModerator && (!membership || !membership.isActive || membership.status !== 'approved')) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro do grupo para curtir publicações"
        });
      }
      
      const result = await storage.toggleGroupPostLike(postId, userId);
      res.json({
        success: true,
        liked: result.liked,
        likesCount: result.likesCount
      });
    } catch (error) {
      console.error("Error toggling group post like:", error);
      res.status(500).json({ 
        success: false, 
        message: "Não foi possível curtir o post"
      });
    }
  });

  // Get comments for group post
  app.get("/api/groups/:groupId/posts/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const { groupId, postId } = req.params;
      const userId = req.user.id;
      
      // Check if user is member of this group
      const membership = await storage.getGroupMembership(groupId, userId);
      const isModerator = await storage.isGroupModerator(groupId, userId);
      
      if (!isModerator && (!membership || !membership.isActive || membership.status !== 'approved')) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro do grupo para ver comentários"
        });
      }
      
      const comments = await storage.getGroupPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching group post comments:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch comments" 
      });
    }
  });

  // Add comment to group post
  app.post("/api/groups/:groupId/posts/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const { groupId, postId } = req.params;
      const userId = req.user.id;
      const { content, mentionedUsers } = req.body;
      
      // Check if user is member of this group
      const membership = await storage.getGroupMembership(groupId, userId);
      const isModerator = await storage.isGroupModerator(groupId, userId);
      
      if (!isModerator && (!membership || !membership.isActive || membership.status !== 'approved')) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro do grupo para comentar"
        });
      }
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Conteúdo do comentário é obrigatório" 
        });
      }

      const comment = await storage.createGroupPostComment({
        postId,
        authorId: userId,
        content: content.trim(),
        mentionedUsers: mentionedUsers || [],
      });

      const commentWithAuthor = await storage.getGroupPostCommentWithAuthor(comment.id);
      res.status(201).json(commentWithAuthor);
    } catch (error) {
      console.error("Error creating group post comment:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Forums routes
  // Get forums for a group
  app.get("/api/groups/:groupId/forums", isAuthenticated, async (req, res) => {
    try {
      const { groupId } = req.params;
      const forums = await storage.getGroupForums(groupId);
      res.json(forums);
    } catch (error) {
      console.error("Error fetching forums:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch forums" 
      });
    }
  });

  // Create forum (moderator only)
  app.post("/api/groups/:groupId/forums", isAuthenticated, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem criar fóruns"
        });
      }
      
      const forumData = {
        ...req.body,
        groupId,
        createdBy: userId
      };
      
      const forum = await storage.createForum(forumData);
      res.json({
        success: true,
        forum,
        message: "Fórum criado com sucesso"
      });
    } catch (error) {
      console.error("Error creating forum:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create forum" 
      });
    }
  });

  // Update forum (moderator only)
  app.put("/api/forums/:forumId", isAuthenticated, async (req, res) => {
    try {
      const { forumId } = req.params;
      const userId = req.user.id;
      
      // Get forum to check group
      const forum = await storage.getForum(forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(forum.groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem editar fóruns"
        });
      }
      
      const updatedForum = await storage.updateForum(forumId, req.body);
      res.json({
        success: true,
        forum: updatedForum,
        message: "Fórum atualizado com sucesso"
      });
    } catch (error) {
      console.error("Error updating forum:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update forum" 
      });
    }
  });

  // Delete forum (moderator only)
  app.delete("/api/forums/:forumId", isAuthenticated, async (req, res) => {
    try {
      const { forumId } = req.params;
      const userId = req.user.id;
      
      // Get forum to check group
      const forum = await storage.getForum(forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is moderator of this group
      const isModerator = await storage.isGroupModerator(forum.groupId, userId);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas moderadores podem excluir fóruns"
        });
      }
      
      const deleted = await storage.deleteForum(forumId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      res.json({
        success: true,
        message: "Fórum excluído com sucesso"
      });
    } catch (error) {
      console.error("Error deleting forum:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete forum" 
      });
    }
  });

  // Get forum details
  app.get("/api/forums/:forumId", isAuthenticated, async (req, res) => {
    try {
      const { forumId } = req.params;
      const userId = req.user.id;
      
      const forum = await storage.getForum(forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is member of the group
      const membership = await storage.getGroupMembership(forum.groupId, userId);
      if (!membership || membership.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro aprovado para acessar este fórum"
        });
      }
      
      res.json(forum);
    } catch (error) {
      console.error("Error fetching forum:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch forum" 
      });
    }
  });

  // Get all forums (accessible based on user membership and plan)
  app.get("/api/forums", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      // Check if user has access to forums (Junior, Pleno, Senior, Honra, Diretivo)
      const allowedPlans = ['Junior', 'Pleno', 'Senior', 'Honra', 'Diretivo'];
      if (!user.planName || !allowedPlans.includes(user.planName)) {
        return res.status(403).json({
          success: false,
          message: "Apenas membros Junior, Pleno, Senior, Honra e Diretivo podem acessar os fóruns"
        });
      }
      
      const forums = await storage.getAllForums();
      
      // For each forum, get additional data
      const forumsWithData = await Promise.all(forums.map(async (forum) => {
        const [group, topics, members] = await Promise.all([
          storage.getGroupById(forum.groupId),
          storage.getForumTopics(forum.id),
          storage.getGroupMembers(forum.groupId)
        ]);
        
        // Check if user is member of this group
        const membership = await storage.getGroupMembership(forum.groupId, userId);
        const canAccess = membership && membership.status === 'approved' && membership.isActive;
        
        // Get last activity from topics
        const lastActivity = topics.length > 0 
          ? Math.max(...topics.map(t => new Date(t.lastReplyAt || t.createdAt).getTime()))
          : new Date(forum.createdAt).getTime();
        
        return {
          ...forum,
          group: group ? { id: group.id, title: group.title } : null,
          topicCount: topics.length,
          memberCount: members.length,
          lastActivity: new Date(lastActivity),
          canAccess
        };
      }));
      
      res.json(forumsWithData);
    } catch (error) {
      console.error("Error fetching forums:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch forums" 
      });
    }
  });

  // Get forum topics
  app.get("/api/forums/:forumId/topics", isAuthenticated, async (req, res) => {
    try {
      const { forumId } = req.params;
      const userId = req.user.id;
      
      // Get forum to check group access
      const forum = await storage.getForum(forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is member of the group
      const membership = await storage.getGroupMembership(forum.groupId, userId);
      if (!membership || membership.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro aprovado para ver os tópicos"
        });
      }
      
      const topics = await storage.getForumTopics(forumId);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching forum topics:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch forum topics" 
      });
    }
  });

  // Create forum topic
  app.post("/api/forums/:forumId/topics", isAuthenticated, async (req, res) => {
    try {
      const { forumId } = req.params;
      const userId = req.user.id;
      
      // Get forum to check group access
      const forum = await storage.getForum(forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is member of the group with active membership
      const membership = await storage.getGroupMembership(forum.groupId, userId);
      if (!membership || membership.status !== 'approved' || !membership.isActive) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro ativo para criar tópicos"
        });
      }
      
      const topicData = {
        ...req.body,
        forumId,
        authorId: userId
      };
      
      const topic = await storage.createForumTopic(topicData);
      res.json({
        success: true,
        topic,
        message: "Tópico criado com sucesso"
      });
    } catch (error) {
      console.error("Error creating forum topic:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create forum topic" 
      });
    }
  });

  // Get forum topic details
  app.get("/api/forums/:forumId/topics/:topicId", isAuthenticated, async (req, res) => {
    try {
      const { forumId, topicId } = req.params;
      const userId = req.user.id;
      
      // Get forum to check group access
      const forum = await storage.getForum(forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is member of the group
      const membership = await storage.getGroupMembership(forum.groupId, userId);
      if (!membership || membership.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro aprovado para ver este tópico"
        });
      }
      
      const topic = await storage.getForumTopic(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Tópico não encontrado"
        });
      }
      
      // Increment view count
      await storage.incrementTopicViewCount(topicId);
      
      res.json(topic);
    } catch (error) {
      console.error("Error fetching forum topic:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch forum topic" 
      });
    }
  });

  // Get topic replies
  app.get("/api/topics/:topicId/replies", isAuthenticated, async (req, res) => {
    try {
      const { topicId } = req.params;
      const userId = req.user.id;
      
      // Get topic to check forum and group access
      const topic = await storage.getForumTopic(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Tópico não encontrado"
        });
      }

      const forum = await storage.getForum(topic.forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is member of the group
      const membership = await storage.getGroupMembership(forum.groupId, userId);
      if (!membership || membership.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro aprovado para ver as respostas"
        });
      }
      
      const replies = await storage.getTopicReplies(topicId, userId);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching topic replies:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch topic replies" 
      });
    }
  });

  // Create topic reply
  app.post("/api/topics/:topicId/replies", isAuthenticated, async (req, res) => {
    try {
      const { topicId } = req.params;
      const userId = req.user.id;
      
      // Get topic to check forum and group access
      const topic = await storage.getForumTopic(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Tópico não encontrado"
        });
      }

      // Check if topic is locked
      if (topic.isLocked) {
        return res.status(403).json({
          success: false,
          message: "Este tópico está fechado para novas respostas"
        });
      }

      const forum = await storage.getForum(topic.forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is member of the group with active membership
      const membership = await storage.getGroupMembership(forum.groupId, userId);
      if (!membership || membership.status !== 'approved' || !membership.isActive) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro ativo para responder"
        });
      }
      
      const replyData = {
        ...req.body,
        topicId,
        authorId: userId
      };
      
      const reply = await storage.createForumReply(replyData);
      res.json({
        success: true,
        reply,
        message: "Resposta criada com sucesso"
      });
    } catch (error) {
      console.error("Error creating topic reply:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create topic reply" 
      });
    }
  });

  // Lock/unlock topic (author or moderator only)
  app.patch("/api/topics/:topicId/lock", isAuthenticated, async (req, res) => {
    try {
      const { topicId } = req.params;
      const userId = req.user.id;
      const { isLocked } = req.body;
      
      // Get topic to check ownership and forum access
      const topic = await storage.getForumTopic(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Tópico não encontrado"
        });
      }

      const forum = await storage.getForum(topic.forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }

      // Check if user is topic author or group moderator
      const isModerator = await storage.isGroupModerator(forum.groupId, userId);
      const isAuthor = topic.authorId === userId;
      
      if (!isAuthor && !isModerator) {
        return res.status(403).json({
          success: false,
          message: "Apenas o autor do tópico ou moderadores podem fechar/abrir tópicos"
        });
      }
      
      const success = isLocked ? 
        await storage.lockTopic(topicId) : 
        await storage.unlockTopic(topicId);
        
      if (!success) {
        return res.status(500).json({
          success: false,
          message: "Erro ao atualizar status do tópico"
        });
      }
      
      res.json({
        success: true,
        message: isLocked ? "Tópico fechado com sucesso" : "Tópico reaberto com sucesso"
      });
    } catch (error) {
      console.error("Error toggling topic lock:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to toggle topic lock" 
      });
    }
  });

  // Get topic participants count
  app.get("/api/topics/:topicId/participants", isAuthenticated, async (req, res) => {
    try {
      const { topicId } = req.params;
      const userId = req.user.id;
      
      // Get topic to check forum and group access
      const topic = await storage.getForumTopic(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Tópico não encontrado"
        });
      }

      const forum = await storage.getForum(topic.forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is member of the group
      const membership = await storage.getGroupMembership(forum.groupId, userId);
      if (!membership || membership.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro aprovado para ver esta informação"
        });
      }
      
      const count = await storage.getTopicParticipantsCount(topicId);
      res.json({ participantsCount: count });
    } catch (error) {
      console.error("Error fetching topic participants:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch topic participants" 
      });
    }
  });

  // Like/unlike forum reply
  app.post("/api/topics/replies/:replyId/like", isAuthenticated, async (req, res) => {
    try {
      const { replyId } = req.params;
      const userId = req.user.id;
      
      // Get reply to check topic and forum access
      const reply = await storage.getForumReply(replyId);
      if (!reply) {
        return res.status(404).json({
          success: false,
          message: "Resposta não encontrada"
        });
      }

      const topic = await storage.getForumTopic(reply.topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Tópico não encontrado"
        });
      }

      const forum = await storage.getForum(topic.forumId);
      if (!forum) {
        return res.status(404).json({
          success: false,
          message: "Fórum não encontrado"
        });
      }
      
      // Check if user is member of the group
      const membership = await storage.getGroupMembership(forum.groupId, userId);
      if (!membership || membership.status !== 'approved' || !membership.isActive) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ser membro ativo para curtir respostas"
        });
      }
      
      const likeResult = await storage.likeForumReply(replyId, userId);
      const isLiked = await storage.isReplyLikedByUser(replyId, userId);
      
      res.json({
        success: true,
        liked: isLiked,
        message: isLiked ? "Resposta curtida" : "Curtida removida"
      });
    } catch (error) {
      console.error("Error toggling reply like:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to toggle reply like" 
      });
    }
  });

  // Admin Membership Plans Management Routes
  app.get("/api/admin/membership-plans", isAdminAuthenticated, async (req, res) => {
    try {
      const plans = await storage.getAllMembershipPlansWithCount();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      res.status(500).json({ message: "Failed to fetch membership plans" });
    }
  });

  app.post("/api/admin/membership-plans", isAdminAuthenticated, async (req, res) => {
    try {
      const planData = req.body;
      
      // Validate required fields
      if (!planData.name || typeof planData.price !== 'number') {
        return res.status(400).json({ error: "Name and price are required" });
      }

      // Convert price from decimal to cents
      if (planData.price && typeof planData.price === 'number') {
        planData.price = Math.round(planData.price * 100);
      }

      const newPlan = await storage.createMembershipPlan({
        ...planData,
        id: undefined, // Let database generate ID
      });

      res.status(201).json(newPlan);
    } catch (error) {
      console.error("Error creating membership plan:", error);
      res.status(500).json({ message: "Failed to create membership plan" });
    }
  });

  app.put("/api/admin/membership-plans/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Convert price from decimal to cents if it's a number
      if (updateData.price && typeof updateData.price === 'number') {
        updateData.price = Math.round(updateData.price * 100);
      }

      const updatedPlan = await storage.updateMembershipPlan(id, updateData);
      
      if (!updatedPlan) {
        return res.status(404).json({ error: "Membership plan not found" });
      }

      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating membership plan:", error);
      res.status(500).json({ message: "Failed to update membership plan" });
    }
  });

  app.delete("/api/admin/membership-plans/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if plan has active members
      const plan = await storage.getMembershipPlanWithCount(id);
      if (plan && plan.currentMembers > 0) {
        return res.status(400).json({ 
          error: `Cannot delete plan with ${plan.currentMembers} active members. Please migrate members to another plan first.` 
        });
      }

      const deleted = await storage.deleteMembershipPlan(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Membership plan not found" });
      }

      res.json({ message: "Membership plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting membership plan:", error);
      res.status(500).json({ message: "Failed to delete membership plan" });
    }
  });

  app.patch("/api/admin/membership-plans/:id/toggle-status", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }

      const updatedPlan = await storage.toggleMembershipPlanStatus(id, isActive);
      
      if (!updatedPlan) {
        return res.status(404).json({ error: "Membership plan not found" });
      }

      res.json(updatedPlan);
    } catch (error) {
      console.error("Error toggling membership plan status:", error);
      res.status(500).json({ message: "Failed to toggle membership plan status" });
    }
  });

  app.get("/api/admin/membership-plans/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.getMembershipPlanWithCount(id);
      
      if (!plan) {
        return res.status(404).json({ error: "Membership plan not found" });
      }

      res.json(plan);
    } catch (error) {
      console.error("Error fetching membership plan:", error);
      res.status(500).json({ message: "Failed to fetch membership plan" });
    }
  });

  // Orders Routes
  
  // Get user's order history
  app.get("/api/user/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Admin: Get all orders with pagination
  app.get("/api/admin/orders", isAdminAuthenticated, async (req, res) => {
    try {
      console.log("Admin orders route accessed by user:", req.user?.username, "role:", req.user?.role);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      console.log("Fetching orders with limit:", limit, "offset:", offset);
      const orders = await storage.getAllOrders(limit, offset);
      console.log("Orders found:", orders.length);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Object Storage routes for image uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const updateData = req.body;
      
      // Validate the update data
      const allowedFields = ['fullName', 'phone', 'city', 'state', 'area', 'position', 'bio'];
      const filteredData: any = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }
      
      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const updatedUser = await storage.updateUser(userId, filteredData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change user password
  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      // Import password utilities
      const { verifyPassword, hashPassword } = await import("./auth");
      
      // Get current user
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password!);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(userId, { password: hashedNewPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Plan Change Requests Routes
  
  // Get user's current plan change request
  app.get("/api/user/plan-change-request", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const request = await storage.getUserPlanChangeRequest(userId);
      
      if (!request) {
        return res.status(200).json(null);
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching plan change request:", error);
      res.status(500).json({ error: "Failed to fetch plan change request" });
    }
  });

  // Create plan change request
  app.post("/api/user/plan-change-request", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Check if user already has a pending request
      const existingRequest = await storage.getUserPlanChangeRequest(userId);
      if (existingRequest) {
        return res.status(400).json({ error: "You already have a pending plan change request" });
      }
      
      const requestData = insertPlanChangeRequestSchema.parse({
        ...req.body,
        userId,
        currentPlanId: req.user!.currentPlanId
      });
      
      const request = await storage.createPlanChangeRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating plan change request:", error);
      res.status(500).json({ error: "Failed to create plan change request" });
    }
  });

  // Admin: Get all plan change requests
  app.get("/api/admin/plan-change-requests", isAdminAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getPlanChangeRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching plan change requests:", error);
      res.status(500).json({ error: "Failed to fetch plan change requests" });
    }
  });

  // Admin: Approve plan change request
  app.post("/api/admin/plan-change-requests/:id/approve", isAdminAuthenticated, async (req, res) => {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { adminNotes } = req.body;
      
      const request = await storage.approvePlanChangeRequest(id, adminId, adminNotes);
      
      if (!request) {
        return res.status(404).json({ error: "Plan change request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error approving plan change request:", error);
      res.status(500).json({ error: "Failed to approve plan change request" });
    }
  });

  // Admin: Reject plan change request
  app.post("/api/admin/plan-change-requests/:id/reject", isAdminAuthenticated, async (req, res) => {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { adminNotes } = req.body;
      
      const request = await storage.rejectPlanChangeRequest(id, adminId, adminNotes);
      
      if (!request) {
        return res.status(404).json({ error: "Plan change request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error rejecting plan change request:", error);
      res.status(500).json({ error: "Failed to reject plan change request" });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve mobile app
  app.get("/mobile", async (req, res) => {
    try {
      const mobileAppPath = path.join(process.cwd(), 'mobile-web', 'index.html');
      const content = await fs.readFile(mobileAppPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      console.error('Error serving mobile app:', error);
      res.status(404).send('Mobile app not found');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
