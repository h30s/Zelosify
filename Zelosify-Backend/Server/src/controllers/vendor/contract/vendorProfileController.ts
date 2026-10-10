import { Request, Response } from "express";
import {
  getVendorPreview,
  presignProfiles,
  softDeleteProfile,
  submitProfiles,
} from "../../../services/contract/profileService.js";
import { ContractError } from "../../../services/contract/openingService.js";

export async function presignVendorProfiles(req: Request, res: Response) {
  try {
    const files = await presignProfiles((req as any).user, req.params.id, req.body.filenames);
    return res.json({ success: true, files });
  } catch (error) {
    return sendError(res, error, "Failed to generate presigned URLs");
  }
}

export async function submitVendorProfiles(req: Request, res: Response) {
  try {
    const profiles = await submitProfiles((req as any).user, req.params.id, req.body.s3Keys);
    return res.status(201).json({
      success: true,
      message: "Profiles submitted successfully",
      count: profiles.length,
      profiles: profiles.map(({ id, status, submittedAt }) => ({ id, status, submittedAt })),
    });
  } catch (error) {
    return sendError(res, error, "Failed to submit profiles");
  }
}

export async function softDeleteVendorProfile(req: Request, res: Response) {
  try {
    await softDeleteProfile((req as any).user, profileId(req.params.id));
    return res.json({ success: true, message: "Profile soft deleted successfully" });
  } catch (error) {
    return sendError(res, error, "Failed to delete profile");
  }
}

export async function previewVendorProfile(req: Request, res: Response) {
  try {
    const preview = await getVendorPreview((req as any).user, profileId(req.params.id));
    res.setHeader("Content-Type", preview.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${preview.fileName}"`);
    return preview.stream.pipe(res);
  } catch (error) {
    return sendError(res, error, "Failed to preview profile");
  }
}

function profileId(value: string) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id)) throw new ContractError(400, "Invalid profile ID");
  return id;
}

function sendError(res: Response, error: unknown, fallback: string) {
  if (!(error instanceof ContractError) || error.statusCode >= 500) {
    console.error("[vendorProfileController error]:", error);
  }
  const status = error instanceof ContractError ? error.statusCode : 500;
  const message = error instanceof ContractError ? error.message : fallback;
  return res.status(status).json({
    message,
    debugError:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error),
  });
}

