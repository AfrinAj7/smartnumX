import { createHash, randomBytes } from "node:crypto";
import type { AuthTokenPurpose, UserRole, UserStatus } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  resetPasswordSchema,
  tokenSchema,
} from "./validators";

const TOKEN_TTL_MS = 30 * 60 * 1000;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  passwordHash: string | null;
  mustChangePassword: boolean;
  emailVerified: Date | null;
  role: UserRole;
  status: UserStatus;
  deletedAt: Date | null;
};

export type LoginThrottleState = {
  failures: number;
  windowStartedAt: Date;
  lockedUntil: Date | null;
};

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(userId: string): Promise<AuthUser | null>;
  createUserWithVerification(input: {
    name: string;
    email: string;
    phone: string | undefined;
    passwordHash: string;
    tokenHash: string;
    expiresAt: Date;
    termsAcceptedAt: Date;
    privacyPolicyVersion: string;
  }): Promise<AuthUser>;
  replaceToken(input: {
    userId: string;
    tokenHash: string;
    purpose: AuthTokenPurpose;
    expiresAt: Date;
  }): Promise<void>;
  consumeToken(
    tokenHash: string,
    purpose: AuthTokenPurpose,
    now: Date,
  ): Promise<AuthUser | null>;
  setPasswordWithToken(
    tokenHash: string,
    passwordHash: string,
    now: Date,
  ): Promise<boolean>;
  updatePasswordByUserId(userId: string, passwordHash: string): Promise<boolean>;
  getLoginThrottle(key: string): Promise<LoginThrottleState | null>;
  recordLoginFailure(key: string, now: Date): Promise<LoginThrottleState>;
  clearLoginThrottle(key: string): Promise<void>;
}

export interface AuthMailer {
  sendVerification(email: string, name: string, token: string): Promise<void>;
  sendPasswordReset(email: string, name: string, token: string): Promise<void>;
}

export type AuthDependencies = {
  repository: AuthRepository;
  mailer: AuthMailer;
  now?: () => Date;
};

function newToken() {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: createHash("sha256").update(rawToken).digest("hex"),
  };
}

function hashRateLimitKey(email: string, ipAddress: string) {
  return createHash("sha256")
    .update(`${email}\u0000${ipAddress}`)
    .digest("hex");
}

function tokenExpiry(now: Date) {
  return new Date(now.getTime() + TOKEN_TTL_MS);
}

export async function consumeAccountRequestQuota(
  scope: "register" | "forgot-password" | "lead-demo",
  ipAddress: string,
  dependencies: AuthDependencies,
) {
  const now = dependencies.now?.() ?? new Date();
  const key = hashRateLimitKey(scope, ipAddress);
  const current = await dependencies.repository.getLoginThrottle(key);
  if (current?.lockedUntil && current.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.lockedUntil.getTime() - now.getTime()) / 1000)),
    };
  }

  await dependencies.repository.recordLoginFailure(key, now);
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function registerUser(
  input: unknown,
  dependencies: AuthDependencies,
) {
  const data = registerSchema.parse(input);
  const now = dependencies.now?.() ?? new Date();
  const existingUser = await dependencies.repository.findUserByEmail(data.email);

  if (existingUser) {
    if (
      !existingUser.deletedAt &&
      !existingUser.emailVerified &&
      existingUser.status === "ACTIVE"
    ) {
      const token = newToken();
      await dependencies.repository.replaceToken({
        userId: existingUser.id,
        tokenHash: token.tokenHash,
        purpose: "EMAIL_VERIFICATION",
        expiresAt: tokenExpiry(now),
      });
      await dependencies.mailer.sendVerification(
        existingUser.email,
        existingUser.name ?? data.name,
        token.rawToken,
      );
    }
    return { ok: true };
  }

  const token = newToken();
  const passwordHash = await hash(data.password, 12);
  const user = await dependencies.repository.createUserWithVerification({
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    passwordHash,
    tokenHash: token.tokenHash,
    expiresAt: tokenExpiry(now),
    termsAcceptedAt: now,
    privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || "v1",
  });

  await dependencies.mailer.sendVerification(
    user.email,
    user.name ?? data.name,
    token.rawToken,
  );
  return { ok: true };
}

export async function verifyEmail(
  input: unknown,
  dependencies: AuthDependencies,
) {
  const { token } = tokenSchema.parse(input);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await dependencies.repository.consumeToken(
    tokenHash,
    "EMAIL_VERIFICATION",
    dependencies.now?.() ?? new Date(),
  );
  return Boolean(user);
}

export async function requestPasswordReset(
  input: unknown,
  dependencies: AuthDependencies,
) {
  const { email } = emailSchema.parse(input);
  const user = await dependencies.repository.findUserByEmail(email);

  if (user?.status === "ACTIVE" && !user.deletedAt && user.emailVerified) {
    const now = dependencies.now?.() ?? new Date();
    const token = newToken();
    await dependencies.repository.replaceToken({
      userId: user.id,
      tokenHash: token.tokenHash,
      purpose: "PASSWORD_RESET",
      expiresAt: tokenExpiry(now),
    });
    await dependencies.mailer.sendPasswordReset(
      user.email,
      user.name ?? "student",
      token.rawToken,
    );
  }

  return { ok: true };
}

export async function resetPassword(
  input: unknown,
  dependencies: AuthDependencies,
) {
  const data = resetPasswordSchema.parse(input);
  const tokenHash = createHash("sha256").update(data.token).digest("hex");
  const passwordHash = await hash(data.password, 12);
  return dependencies.repository.setPasswordWithToken(
    tokenHash,
    passwordHash,
    dependencies.now?.() ?? new Date(),
  );
}

export async function changePassword(
  userId: string,
  input: unknown,
  dependencies: AuthDependencies,
) {
  const data = changePasswordSchema.parse(input);
  const user = await dependencies.repository.findUserById(userId);
  if (!user?.passwordHash || user.status !== "ACTIVE" || user.deletedAt) return false;
  if (!(await compare(data.currentPassword, user.passwordHash))) return false;

  const passwordHash = await hash(data.password, 12);
  return dependencies.repository.updatePasswordByUserId(userId, passwordHash);
}

export async function authenticateCredentials(
  input: unknown,
  ipAddress: string,
  dependencies: AuthDependencies,
) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return null;

  const now = dependencies.now?.() ?? new Date();
  const key = hashRateLimitKey(parsed.data.email, ipAddress);
  const throttle = await dependencies.repository.getLoginThrottle(key);
  if (throttle?.lockedUntil && throttle.lockedUntil > now) return null;

  const user = await dependencies.repository.findUserByEmail(parsed.data.email);
  const validPassword = user?.passwordHash
    ? await compare(parsed.data.password, user.passwordHash)
    : false;

  if (
    !user ||
    !validPassword ||
    !user.emailVerified ||
    user.status !== "ACTIVE" ||
    user.deletedAt
  ) {
    await dependencies.repository.recordLoginFailure(key, now);
    return null;
  }

  await dependencies.repository.clearLoginThrottle(key);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    emailVerified: user.emailVerified,
    mustChangePassword: user.mustChangePassword,
    role: user.role,
    status: user.status,
  };
}

export function getAuthTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}