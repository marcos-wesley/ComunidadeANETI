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
        console.log("Attempting login for username:", username);
        const user = await storage.getUserByUsername(username);
        console.log("User found:", user ? "YES" : "NO");
        
        if (!user) {
          console.log("User not found");
          return done(null, false);
        }
        
        if (!user.password) {
          console.log("User has no password");
          return done(null, false);
        }
        
        console.log("Comparing passwords...");
        const passwordMatch = await comparePasswords(password, user.password);
        console.log("Password match:", passwordMatch);
        
        if (!passwordMatch) {
          console.log("Password mismatch");
          return done(null, false);
        }
        
        console.log("Login successful for user:", user.username);
        return done(null, user);
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

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
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

