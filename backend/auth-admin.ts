import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { AdminUser, InsertAdminUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(":");
  const hashToVerify = (await scryptAsync(password, salt, 64)) as Buffer;
  return hash === hashToVerify.toString("hex");
}

export interface AdminAuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

export interface AdminSessionData {
  adminUserId: string;
  username: string;
  role: string;
  isAuthenticated: true;
}

export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    const adminUser = await storage.getAdminUserByUsername(username);
    if (!adminUser || !adminUser.isActive) {
      return null;
    }

    const isValid = await verifyPassword(password, adminUser.password);
    if (!isValid) {
      return null;
    }

    // Update last login time
    await storage.updateAdminUser(adminUser.id, {
      lastLoginAt: new Date(),
    });

    return adminUser;
  } catch (error) {
    console.error("Admin authentication error:", error);
    return null;
  }
}

export async function createFirstAdminUser(userData: {
  username: string;
  email: string;
  password: string;
  fullName: string;
}): Promise<AdminUser> {
  const hashedPassword = await hashPassword(userData.password);
  
  const adminUserData: InsertAdminUser = {
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    fullName: userData.fullName,
    role: "super_admin", // First admin user gets super admin privileges
  };

  return await storage.createAdminUser(adminUserData);
}

export function requireAdminAuth(req: any, res: any, next: any) {
  if (!req.session?.adminUser?.isAuthenticated) {
    return res.status(401).json({ 
      success: false, 
      message: "Admin authentication required" 
    });
  }
  
  req.adminUser = req.session.adminUser;
  next();
}

export function requireSuperAdmin(req: any, res: any, next: any) {
  if (!req.session?.adminUser?.isAuthenticated) {
    return res.status(401).json({ 
      success: false, 
      message: "Admin authentication required" 
    });
  }

  if (req.session.adminUser.role !== "super_admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Super admin privileges required" 
    });
  }
  
  req.adminUser = req.session.adminUser;
  next();
}