import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../../../config/prisma/prisma.js";
import { Role } from "@prisma/client";

export const devLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_LOGIN !== "true") {
      res.status(404).json({ message: "Not found" });
      return;
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET is required for development login");
    const { role, username, tenantId = "tenant-bruce-wayne" } = req.body;

    let targetRole: Role = Role.IT_VENDOR;
    if (role === "HIRING_MANAGER") {
      targetRole = Role.HIRING_MANAGER;
    } else if (role === "IT_VENDOR") {
      targetRole = Role.IT_VENDOR;
    }

    let user = null;
    if (username) {
      user = await prisma.user.findFirst({
        where: { username, role: targetRole, tenantId },
        include: { tenant: true },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          role: targetRole,
          tenantId,
        },
        include: { tenant: true },
      });
    }

    if (!user) {
      res.status(404).json({ message: "No suitable user found for role" });
      return;
    }

    // Sign JWT access token
    const tokenPayload = {
      sub: user.id,
      id: user.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      realm_access: {
        roles: [user.role],
      },
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: "24h",
      algorithm: "HS256",
    });

    const refreshToken = jwt.sign(
      { sub: user.id, type: "refresh" },
      jwtSecret,
      {
        expiresIn: "30d",
        algorithm: "HS256",
      }
    );

    // Set cookies
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 3600 * 1000,
      path: "/",
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 3600 * 1000,
      path: "/",
    });

    res.cookie("role", user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 3600 * 1000,
      path: "/",
    });

    const redirectTo =
      user.role === Role.HIRING_MANAGER
        ? "/hiring-manager/openings"
        : "/vendor/openings";

    res.json({
      success: true,
      message: `Logged in as ${user.role}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        companyName: user.tenant?.companyName,
      },
      redirectTo,
    });
  } catch (error: any) {
    console.error("devLogin error:", error);
    res.status(500).json({ message: error.message });
  }
};
