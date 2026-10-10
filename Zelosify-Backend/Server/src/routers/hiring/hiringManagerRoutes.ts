import { Router, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  getHiringManagerOpenings,
  getHiringManagerProfiles,
} from "../../controllers/hiring/contract/hiringContractController.js";
import {
  shortlistProfile,
  rejectProfile,
  previewHiringManagerProfile,
} from "../../controllers/hiring/contract/hiringActionController.js";

const router = Router();

const hmAuth: RequestHandler[] = [
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
];

/**
 * 1. GET /api/hiring-manager/openings - Only own openings
 */
router.get("/openings", ...hmAuth, (async (req, res, next) => {
  try {
    await getHiringManagerOpenings(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * 2. GET /api/hiring-manager/openings/:id/profiles - Submitted profiles with AI recommendations
 */
router.get("/openings/:id/profiles", ...hmAuth, (async (req, res, next) => {
  try {
    await getHiringManagerProfiles(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * 3. POST /api/hiring-manager/profiles/:id/shortlist - Shortlist candidate profile
 */
router.post("/profiles/:id/shortlist", ...hmAuth, (async (req, res, next) => {
  try {
    await shortlistProfile(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * 4. POST /api/hiring-manager/profiles/:id/reject - Reject candidate profile
 */
router.post("/profiles/:id/reject", ...hmAuth, (async (req, res, next) => {
  try {
    await rejectProfile(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * 5. GET /api/hiring-manager/profiles/:id/preview - File preview via backend
 */
router.get("/profiles/:id/preview", ...hmAuth, (async (req, res, next) => {
  try {
    await previewHiringManagerProfile(req, res);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

export default router;
