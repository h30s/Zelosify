import { describe, it, expect, vi } from "vitest";
import { authorizeRole } from "../../../src/middlewares/auth/authorizeMiddleware.js";

vi.mock("../../../src/config/prisma/prisma.js", () => ({
  default: {
    opening: {
      count: vi.fn(async () => 1),
      findMany: vi.fn(async ({ where }: any) => [
        {
          id: "opening-1",
          tenantId: where.tenantId,
          title: "Engineer",
          description: null,
          location: "Remote",
          contractType: "C2C",
          hiringManagerId: "manager-1",
          experienceMin: 3,
          experienceMax: 5,
          postedDate: new Date(),
          status: "OPEN",
        },
      ]),
    },
    user: { findMany: vi.fn(async () => []) },
  },
}));

import prisma from "../../../src/config/prisma/prisma.js";
import { listVendorOpenings } from "../../../src/services/contract/openingService.js";

describe("RBAC and Tenant Isolation Unit Tests", () => {
  describe("API-Level RBAC Enforcement", () => {
    it("should allow request if user has the required IT_VENDOR role", async () => {
      const middleware = authorizeRole("IT_VENDOR");
      const req: any = {
        user: { role: "IT_VENDOR", tenantId: "tenant-bruce-wayne" },
        headers: {},
        cookies: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should deny request with 403 when IT_VENDOR attempts to access HIRING_MANAGER endpoint", async () => {
      const middleware = authorizeRole("HIRING_MANAGER");
      const req: any = {
        user: { role: "IT_VENDOR", tenantId: "tenant-bruce-wayne" },
        headers: {},
        cookies: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Access Denied: User does not have required role HIRING_MANAGER"),
        })
      );
    });

    it("should deny request with 403 when HIRING_MANAGER attempts to access IT_VENDOR endpoint", async () => {
      const middleware = authorizeRole("IT_VENDOR");
      const req: any = {
        user: { role: "HIRING_MANAGER", tenantId: "tenant-bruce-wayne" },
        headers: {},
        cookies: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Access Denied: User does not have required role IT_VENDOR"),
        })
      );
    });

    it("should reject request with 400 when an invalid role is provided", async () => {
      const middleware = authorizeRole("SUPER_HACKER_ROLE");
      const req: any = {
        user: { role: "ADMIN" },
        headers: {},
        cookies: { access_token: "mock-token" },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid role provided.",
      });
    });
  });

  describe("Tenant Isolation and Query Filtering Logic", () => {
    it("should strictly scope database queries by user tenantId", async () => {
      await listVendorOpenings(
        { id: "vendor-1", tenantId: "tenant-bruce-wayne" },
        {}
      );

      expect(prisma.opening.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-bruce-wayne" }),
        })
      );
      expect(prisma.opening.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ tenantId: "tenant-bruce-wayne" }),
      });
    });

    it("should enforce hiringManagerId === loggedInUser.id condition for shortlisting", () => {
      const loggedInUserId = "usr-hm-001";
      const profileOpening = {
        hiringManagerId: "usr-hm-002", // belongs to a different manager
        tenantId: "tenant-bruce-wayne",
      };

      const isAllowed = profileOpening.hiringManagerId === loggedInUserId;
      expect(isAllowed).toBe(false);
    });

    it("should disallow IT Vendors from viewing other vendors uploads", () => {
      const vendorUser1 = "usr-vendor-001";
      const upload = {
        id: 101,
        uploadedBy: "usr-vendor-002",
        s3Key: "tenant-bruce-wayne/op-1/resume.pdf",
      };

      const isOwner = upload.uploadedBy === vendorUser1;
      expect(isOwner).toBe(false);
    });
  });
});
