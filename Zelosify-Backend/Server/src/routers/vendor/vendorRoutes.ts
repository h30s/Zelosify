import express, { RequestHandler } from "express";
import vendorRequestRoutes from "./vendorRequestRoutes.js";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  getVendorOpenings,
  getVendorOpeningDetails,
} from "../../controllers/vendor/contract/vendorContractController.js";
import {
  presignVendorProfiles,
  submitVendorProfiles,
  softDeleteVendorProfile,
  previewVendorProfile,
} from "../../controllers/vendor/contract/vendorProfileController.js";

const router = express.Router();

// Enforce IT_VENDOR role for contract openings
const vendorAuth: RequestHandler[] = [
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
];

/**
 * 1. GET /api/vendor/openings - Paginated list of openings for vendor's tenant
 */
router.get("/openings", ...vendorAuth, (async (req, res, next) => {
  try {
    await getVendorOpenings(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * 2. GET /api/vendor/openings/:id - Opening details with own uploaded profiles
 */
router.get("/openings/:id", ...vendorAuth, (async (req, res, next) => {
  try {
    await getVendorOpeningDetails(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * 3. POST /api/vendor/openings/:id/profiles/presign - Presign upload URLs
 */
router.post("/openings/:id/profiles/presign", ...vendorAuth, (async (req, res, next) => {
  try {
    await presignVendorProfiles(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * 4. POST /api/vendor/openings/:id/profiles/upload - Submit candidate profiles (PDF, PPTX)
 */
router.post(
  "/openings/:id/profiles/upload",
  ...vendorAuth,
  (async (req, res, next) => {
    try {
      await submitVendorProfiles(req, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

/**
 * 5. DELETE /api/vendor/profiles/:id - Soft delete profile
 */
router.delete("/profiles/:id", ...vendorAuth, (async (req, res, next) => {
  try {
    await softDeleteVendorProfile(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * 6. GET /api/vendor/profiles/:id/preview - Secure backend file preview
 */
router.get("/profiles/:id/preview", ...vendorAuth, (async (req, res, next) => {
  try {
    await previewVendorProfile(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * Existing legacy route: /vendor/requests
 */
router.use("/requests", vendorRequestRoutes);

export default router;
