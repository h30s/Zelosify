import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import prisma from "../../config/prisma/prisma.js";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080/auth";
const REALM_NAME = process.env.KEYCLOAK_REALM || "Zelosify";

const keycloakJwksClient = jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

// ✅ Extend Express Request to Include User Property
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

// Cache for user data
const userCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

import { formatPublicKey } from "../../utils/jwt/formatPubKey.js";

const keycloakPublicKey = formatPublicKey(process.env.KEYCLOAK_RS256_SIG);
const JWT_SECRET = process.env.JWT_SECRET;

// 🔹 Middleware: Authenticate User & Refresh Token If Expired
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies?.access_token;

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.payload) {
      res.status(401).json({ message: "Invalid token format" });
      return;
    }

    let verifiedPayload: any = null;

    // 1. Verify based on algorithm
    if (decoded.header.alg === "HS256") {
      if (!JWT_SECRET) {
        res.status(500).json({ message: "JWT authentication is not configured" });
        return;
      }
      try {
        verifiedPayload = jwt.verify(token, JWT_SECRET, {
          algorithms: ["HS256"],
        });
      } catch (e: any) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }
    } else {
      // RS256
      let verified = false;
      if (keycloakPublicKey) {
        try {
          verifiedPayload = jwt.verify(token, keycloakPublicKey, {
            algorithms: ["RS256"],
          });
          verified = true;
        } catch {}
      }

      if (!verified) {
        try {
          const key = await keycloakJwksClient.getSigningKey(
            decoded.header.kid
          );
          const signingKey = key.getPublicKey();
          verifiedPayload = jwt.verify(token, signingKey, {
            algorithms: ["RS256"],
            issuer: `${KEYCLOAK_URL}/realms/${REALM_NAME}`,
          });
          verified = true;
        } catch (jwksErr) {
          // If Keycloak is offline/unreachable and token signature cannot be fetched
          console.warn("Keycloak verification failed:", (jwksErr as Error).message);
        }
      }

      if (!verifiedPayload) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }
    }

    const userIdOrSub =
      verifiedPayload.sub || verifiedPayload.id || verifiedPayload.userId;

    // Check cache first
    const cachedUser = userCache.get(userIdOrSub);
    if (cachedUser && cachedUser.timestamp > Date.now() - USER_CACHE_TTL) {
      req.user = cachedUser.data;
      return next();
    }

    // Lookup user in DB
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { externalId: userIdOrSub },
          { id: userIdOrSub },
          { email: verifiedPayload.email || "" },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        department: true,
        provider: true,
        tenantId: true,
        tenant: {
          select: {
            tenantId: true,
            companyName: true,
          },
        },
      },
    });

    if (!user) {
      // Fallback: construct user from verified payload if in dev
      if (verifiedPayload.role && verifiedPayload.tenantId) {
        const payloadUser = {
          id: userIdOrSub,
          username: verifiedPayload.username || "user",
          email: verifiedPayload.email || "user@example.com",
          role: verifiedPayload.role,
          tenantId: verifiedPayload.tenantId,
          department: verifiedPayload.department || "General",
        };
        req.user = payloadUser;
        return next();
      }

      console.log(`❌ User not found: ${userIdOrSub}`);
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Update cache
    userCache.set(userIdOrSub, {
      data: user,
      timestamp: Date.now(),
    });

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
