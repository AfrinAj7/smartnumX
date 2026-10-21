import { hash } from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  authenticateCredentials,
  changePassword,
  consumeAccountRequestQuota,
  getAuthTokenHash,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  type AuthDependencies,
  type AuthRepository,
  type AuthUser,
  type LoginThrottleState,
} from "./auth-service";

type StoredToken = {
  userId: string;
  tokenHash: string;
  purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
  expiresAt: Date;
  consumedAt: Date | null;
};

class FakeAuthRepository implements AuthRepository {
  users = new Map<string, AuthUser>();
  tokens = new Map<string, StoredToken>();
  throttles = new Map<string, LoginThrottleState>();
  consents = new Map<string, { acceptedAt: Date; policyVersion: string }>();

  async findUserByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findUserById(userId: string) {
    return this.users.get(userId) ?? null;
  }

  async createUserWithVerification(input: {
    name: string;
    email: string;
    phone: string | undefined;
    passwordHash: string;
    tokenHash: string;
    expiresAt: Date;
    termsAcceptedAt: Date;
    privacyPolicyVersion: string;
  }) {
    const user: AuthUser = {
      id: `user-${this.users.size + 1}`,
      email: input.email,
      name: input.name,
      phone: input.phone ?? null,
      passwordHash: input.passwordHash,
      mustChangePassword: false,
      emailVerified: null,
      role: "STUDENT",
      status: "ACTIVE",
      deletedAt: null,
    };
    this.users.set(user.id, user);
    this.consents.set(user.id, {
      acceptedAt: input.termsAcceptedAt,
      policyVersion: input.privacyPolicyVersion,
    });
    this.tokens.set(input.tokenHash, {
      userId: user.id,
      tokenHash: input.tokenHash,
      purpose: "EMAIL_VERIFICATION",
      expiresAt: input.expiresAt,
      consumedAt: null,
    });
    return user;
  }

  async replaceToken(input: {
    userId: string;
    tokenHash: string;
    purpose: StoredToken["purpose"];
    expiresAt: Date;
  }) {
    for (const [key, token] of this.tokens) {
      if (token.userId === input.userId && token.purpose === input.purpose) {
        this.tokens.delete(key);
      }
    }
    this.tokens.set(input.tokenHash, { ...input, consumedAt: null });
  }

  async consumeToken(
    tokenHash: string,
    purpose: StoredToken["purpose"],
    now: Date,
  ) {
    const token = this.tokens.get(tokenHash);
    const user = token ? this.users.get(token.userId) : null;
    if (!token || !user || token.purpose !== purpose || token.consumedAt || token.expiresAt <= now) {
      return null;
    }
    token.consumedAt = now;
    if (purpose === "EMAIL_VERIFICATION") user.emailVerified = now;
    return user;
  }

  async setPasswordWithToken(tokenHash: string, passwordHash: string, now: Date) {
    const token = this.tokens.get(tokenHash);
    const user = token ? this.users.get(token.userId) : null;
    if (
      !token ||
      !user ||
      token.purpose !== "PASSWORD_RESET" ||
      token.consumedAt ||
      token.expiresAt <= now ||
      user.status !== "ACTIVE"
    ) {
      return false;
    }
    token.consumedAt = now;
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;
    return true;
  }

  async updatePasswordByUserId(userId: string, passwordHash: string) {
    const user = this.users.get(userId);
    if (!user || user.status !== "ACTIVE") return false;
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;
    return true;
  }

  async getLoginThrottle(key: string) {
    return this.throttles.get(key) ?? null;
  }

  async recordLoginFailure(key: string, now: Date) {
    const current = this.throttles.get(key);
    const expired =
      !current || now.getTime() - current.windowStartedAt.getTime() >= 15 * 60 * 1000;
    const failures = expired ? 1 : current.failures + 1;
    const throttle = {
      failures,
      windowStartedAt: expired ? now : current.windowStartedAt,
      lockedUntil:
        failures >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null,
    };
    this.throttles.set(key, throttle);
    return throttle;
  }

  async clearLoginThrottle(key: string) {
    this.throttles.delete(key);
  }
}

function setup() {
  const repository = new FakeAuthRepository();
  const verificationEmails: Array<{ email: string; token: string }> = [];
  const resetEmails: Array<{ email: string; token: string }> = [];
  let now = new Date("2026-10-06T10:00:00.000Z");
  const dependencies: AuthDependencies = {
    repository,
    mailer: {
      async sendVerification(email, _name, token) {
        verificationEmails.push({ email, token });
      },
      async sendPasswordReset(email, _name, token) {
        resetEmails.push({ email, token });
      },
    },
    now: () => now,
  };
  return {
    repository,
    dependencies,
    verificationEmails,
    resetEmails,
    advanceMinutes(minutes: number) {
      now = new Date(now.getTime() + minutes * 60 * 1000);
    },
  };
}

const validRegistration = {
  name: "A Student",
  email: "student@example.com",
  password: "StudyPass123",
  acceptedTerms: true,
};

describe("auth service", () => {
  it("creates a student with a hashed password and emails a one-time verification link", async () => {
    const context = setup();
    await registerUser(
      { ...validRegistration, email: " STUDENT@example.com " },
      context.dependencies,
    );

    const user = await context.repository.findUserByEmail("student@example.com");
    expect(user?.role).toBe("STUDENT");
    expect(user?.passwordHash).not.toBe(validRegistration.password);
    expect(user?.emailVerified).toBeNull();
    expect(context.repository.consents.get(user?.id ?? "")?.policyVersion).toBe("v1");
    expect(context.verificationEmails).toHaveLength(1);
    expect(context.repository.tokens.has(getAuthTokenHash(context.verificationEmails[0].token))).toBe(true);
  });

  it("verifies an email token once and rejects reuse", async () => {
    const context = setup();
    await registerUser(validRegistration, context.dependencies);
    const token = context.verificationEmails[0].token;

    expect(await verifyEmail({ token }, context.dependencies)).toBe(true);
    expect(await verifyEmail({ token }, context.dependencies)).toBe(false);
    expect((await context.repository.findUserByEmail(validRegistration.email))?.emailVerified).toBeInstanceOf(Date);
  });

  it("returns the same password-reset response for unknown accounts", async () => {
    const context = setup();
    const result = await requestPasswordReset(
      { email: "unknown@example.com" },
      context.dependencies,
    );

    expect(result).toEqual({ ok: true });
    expect(context.resetEmails).toHaveLength(0);
  });

  it("changes a password only once with a valid reset token", async () => {
    const context = setup();
    const passwordHash = await hash(validRegistration.password, 4);
    context.repository.users.set("user-1", {
      id: "user-1",
      email: validRegistration.email,
      name: "A Student",
      phone: null,
      passwordHash,
      mustChangePassword: false,
      emailVerified: new Date(),
      role: "STUDENT",
      status: "ACTIVE",
      deletedAt: null,
    });

    await requestPasswordReset({ email: validRegistration.email }, context.dependencies);
    const token = context.resetEmails[0].token;
    expect(await resetPassword({ token, password: "NewStudyPass123" }, context.dependencies)).toBe(true);
    expect(await resetPassword({ token, password: "AnotherPass123" }, context.dependencies)).toBe(false);
    expect(
      await authenticateCredentials(
        { email: validRegistration.email, password: "NewStudyPass123" },
        "127.0.0.1",
        context.dependencies,
      ),
    ).not.toBeNull();
  });

  it("locks credentials after five failures and allows login after the lock expires", async () => {
    const context = setup();
    const passwordHash = await hash("CorrectPass123", 4);
    context.repository.users.set("user-1", {
      id: "user-1",
      email: validRegistration.email,
      name: "A Student",
      phone: null,
      passwordHash,
      mustChangePassword: false,
      emailVerified: new Date(),
      role: "STUDENT",
      status: "ACTIVE",
      deletedAt: null,
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await authenticateCredentials(
        { email: validRegistration.email, password: "WrongPass123" },
        "127.0.0.1",
        context.dependencies,
      );
    }

    expect(
      await authenticateCredentials(
        { email: validRegistration.email, password: "CorrectPass123" },
        "127.0.0.1",
        context.dependencies,
      ),
    ).toBeNull();

    context.advanceMinutes(16);
    const authenticated = await authenticateCredentials(
      { email: validRegistration.email, password: "CorrectPass123" },
      "127.0.0.1",
      context.dependencies,
    );
    expect(authenticated?.id).toBe("user-1");
    expect(authenticated && "passwordHash" in authenticated).toBe(false);
  });

  it("requires the current password before changing it", async () => {
    const context = setup();
    context.repository.users.set("admin-1", {
      id: "admin-1",
      email: "admin@example.com",
      name: "Super Admin",
      phone: null,
      passwordHash: await hash("CurrentPass123", 4),
      mustChangePassword: true,
      emailVerified: new Date(),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      deletedAt: null,
    });

    expect(
      await changePassword("admin-1", {
        currentPassword: "WrongPass123",
        password: "NewPass1234",
      }, context.dependencies),
    ).toBe(false);
    expect(
      await changePassword("admin-1", {
        currentPassword: "CurrentPass123",
        password: "NewPass1234",
      }, context.dependencies),
    ).toBe(true);
    expect(context.repository.users.get("admin-1")?.mustChangePassword).toBe(false);
  });

  it("limits account requests by hashed IP and permits them after the window expires", async () => {
    const context = setup();
    const requests = await Promise.all(
      Array.from({ length: 5 }, () =>
        consumeAccountRequestQuota("register", "127.0.0.1", context.dependencies),
      ),
    );
    expect(requests.every((request) => request.allowed)).toBe(true);

    const blocked = await consumeAccountRequestQuota(
      "register",
      "127.0.0.1",
      context.dependencies,
    );
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(900);

    context.advanceMinutes(16);
    expect(
      (await consumeAccountRequestQuota("register", "127.0.0.1", context.dependencies)).allowed,
    ).toBe(true);
  });
});