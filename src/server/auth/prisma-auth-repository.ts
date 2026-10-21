import {
  AuthTokenPurpose,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import type {
  AuthRepository,
  LoginThrottleState,
} from "./auth-service";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  passwordHash: true,
  mustChangePassword: true,
  emailVerified: true,
  role: true,
  status: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly database: PrismaClient) {}

  findUserByEmail(email: string) {
    return this.database.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  }

  findUserById(userId: string) {
    return this.database.user.findUnique({
      where: { id: userId },
      select: authUserSelect,
    });
  }

  createUserWithVerification(input: {
    name: string;
    email: string;
    phone: string | undefined;
    passwordHash: string;
    tokenHash: string;
    expiresAt: Date;
    termsAcceptedAt: Date;
    privacyPolicyVersion: string;
  }) {
    return this.database.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash: input.passwordHash,
          termsAcceptedAt: input.termsAcceptedAt,
          privacyPolicyVersion: input.privacyPolicyVersion,
        },
        select: authUserSelect,
      });
      await transaction.authToken.create({
        data: {
          userId: user.id,
          tokenHash: input.tokenHash,
          purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
          expiresAt: input.expiresAt,
        },
      });
      return user;
    });
  }

  async replaceToken(input: {
    userId: string;
    tokenHash: string;
    purpose: AuthTokenPurpose;
    expiresAt: Date;
  }) {
    await this.database.$transaction([
      this.database.authToken.deleteMany({
        where: { userId: input.userId, purpose: input.purpose },
      }),
      this.database.authToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          purpose: input.purpose,
          expiresAt: input.expiresAt,
        },
      }),
    ]);
  }

  consumeToken(tokenHash: string, purpose: AuthTokenPurpose, now: Date) {
    return this.database.$transaction(async (transaction) => {
      const token = await transaction.authToken.findFirst({
        where: {
          tokenHash,
          purpose,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        include: { user: { select: authUserSelect } },
      });
      if (!token) return null;

      const consumed = await transaction.authToken.updateMany({
        where: { id: token.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) return null;

      if (purpose === AuthTokenPurpose.EMAIL_VERIFICATION) {
        return transaction.user.update({
          where: { id: token.userId },
          data: { emailVerified: token.user.emailVerified ?? now },
          select: authUserSelect,
        });
      }
      return token.user;
    });
  }

  setPasswordWithToken(tokenHash: string, passwordHash: string, now: Date) {
    return this.database.$transaction(async (transaction) => {
      const token = await transaction.authToken.findFirst({
        where: {
          tokenHash,
          purpose: AuthTokenPurpose.PASSWORD_RESET,
          consumedAt: null,
          expiresAt: { gt: now },
          user: { status: "ACTIVE", deletedAt: null },
        },
        select: { id: true, userId: true },
      });
      if (!token) return false;

      const consumed = await transaction.authToken.updateMany({
        where: { id: token.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) return false;

      await transaction.user.update({
        where: { id: token.userId },
        data: { passwordHash, mustChangePassword: false },
      });
      await transaction.authToken.deleteMany({
        where: {
          userId: token.userId,
          purpose: AuthTokenPurpose.PASSWORD_RESET,
          id: { not: token.id },
        },
      });
      return true;
    });
  }

  async updatePasswordByUserId(userId: string, passwordHash: string) {
    const result = await this.database.user.updateMany({
      where: { id: userId, status: "ACTIVE", deletedAt: null },
      data: { passwordHash, mustChangePassword: false },
    });
    return result.count === 1;
  }

  getLoginThrottle(key: string) {
    return this.database.loginThrottle.findUnique({
      where: { key },
      select: {
        failures: true,
        windowStartedAt: true,
        lockedUntil: true,
      },
    });
  }

  recordLoginFailure(key: string, now: Date) {
    return this.database.$transaction(
      async (transaction) => {
        const current = await transaction.loginThrottle.findUnique({
          where: { key },
        });
        const windowExpired =
          !current || now.getTime() - current.windowStartedAt.getTime() >= LOGIN_WINDOW_MS;

        if (windowExpired) {
          return transaction.loginThrottle.upsert({
            where: { key },
            create: { key, failures: 1, windowStartedAt: now },
            update: { failures: 1, windowStartedAt: now, lockedUntil: null },
            select: {
              failures: true,
              windowStartedAt: true,
              lockedUntil: true,
            },
          });
        }

        const failures = current.failures + 1;
        return transaction.loginThrottle.update({
          where: { key },
          data: {
            failures,
            lockedUntil:
              failures >= MAX_LOGIN_FAILURES
                ? new Date(now.getTime() + LOGIN_WINDOW_MS)
                : null,
          },
          select: {
            failures: true,
            windowStartedAt: true,
            lockedUntil: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async clearLoginThrottle(key: string) {
    await this.database.loginThrottle.deleteMany({ where: { key } });
  }
}

export type { LoginThrottleState };