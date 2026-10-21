import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppRole;
      status: "ACTIVE" | "SUSPENDED";
      mustChangePassword: boolean;
    };
  }

  interface User {
    role?: AppRole;
    status?: "ACTIVE" | "SUSPENDED";
    mustChangePassword?: boolean;
    deletedAt?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    status?: "ACTIVE" | "SUSPENDED";
    mustChangePassword?: boolean;
  }
}