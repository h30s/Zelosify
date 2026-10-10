import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../../types/typeIndex.js";
import { formatPublicKey } from "../../utils/jwt/formatPubKey.js";
import { isValidRole } from "../../utils/RBAC/isValidRole.js";

const publicKey = formatPublicKey(process.env.KEYCLOAK_RS256_SIG);

export function authorizeRole(requiredrole: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // Validate the provided role
    if (!isValidRole(requiredrole)) {
      res.status(400).json({ message: "Invalid role provided." });
      return;
    }

    // If user was already authenticated by authenticateUser middleware
    if (req.user && req.user.role) {
      if (req.user.role === requiredrole) {
        return next();
      }
      return res.status(403).json({
        message: `Access Denied: User does not have required role ${requiredrole}`,
      });
    }

    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies?.access_token;

    if (!token) {
      res.status(401).json({ message: "Missing token" });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    const decodedHeader = jwt.decode(token, { complete: true });
    if (decodedHeader?.header?.alg === "HS256") {
      if (!JWT_SECRET) {
        return res.status(500).json({ message: "JWT authentication is not configured" });
      }
      try {
        const decoded = jwt.verify(token, JWT_SECRET, {
          algorithms: ["HS256"],
        }) as any;
        const role = decoded.role || decoded.realm_access?.roles?.[0];
        if (role === requiredrole) {
          return next();
        }
        return res.status(403).json({
          message: `Access Denied: User does not have required role ${requiredrole}`,
        });
      } catch (err: any) {
        return res.status(401).json({
          message: "Token verification failed",
          error: err?.message,
        });
      }
    }

    // Validate public key for RS256
    if (!publicKey) {
      return res.status(500).json({ message: "Public key not configured" });
    }

    jwt.verify(
      token,
      publicKey,
      { algorithms: ["RS256"] },
      async (err, decoded) => {
        if (err || typeof decoded !== "object") {
          return res.status(401).json({
            message: "Token verification failed",
            error: err?.message,
          });
        }

        const role = (decoded as any).realm_access?.roles || [];
        const singleRole = (decoded as any).role;
        if (!role.includes(requiredrole) && singleRole !== requiredrole) {
          return res.status(403).json({
            message: `Access Denied: User does not have required role ${requiredrole}`,
          });
        }
        next();
      }
    );
  };
}
