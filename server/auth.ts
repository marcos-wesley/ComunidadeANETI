import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
    namespace Session {
      interface SessionData {
        adminUser?: {
          adminUserId: string;
          username: string;
          role: string;
          isAuthenticated: boolean;
        };
      }
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string | null | undefined) {
  if (!stored || typeof stored !== 'string') {
    return false;
  }
  
  // Check if it's a bcrypt hash (from migration)
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$') || stored.startsWith('$2y$')) {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(supplied, stored);
  }
  
  // Check if it's scrypt format (current system)
  if (!stored.includes('.')) {
    // Invalid password format
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function verifyPassword(supplied: string, stored: string | null | undefined) {
  return comparePasswords(supplied, stored);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error("Error in passport strategy:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get user with plan information
      const userWithPlan = await storage.getUserById(req.user!.id);
      if (!userWithPlan) {
        return res.sendStatus(404);
      }
      
      res.json(userWithPlan);
    } catch (error) {
      console.error("Error fetching user with plan:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/user/application", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const application = await storage.getUserApplication(userId);
      
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: "No application found for this user" 
        });
      }

      res.json(application);
    } catch (error) {
      console.error("Error fetching user application:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch application details" 
      });
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.sendStatus(401);
};

// Middleware to check if user is admin
export const isAdminAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.adminUser) {
    req.user = req.session.adminUser;
    return next();
  }
  res.sendStatus(401);
};

