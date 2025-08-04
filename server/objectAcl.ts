// Object ACL module for basic object access control
// This is a simplified version for credential image uploads

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
}