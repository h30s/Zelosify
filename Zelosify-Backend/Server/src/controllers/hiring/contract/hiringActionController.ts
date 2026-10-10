import { ProfileStatus } from "@prisma/client";
import { Request, Response } from "express";
import { setProfileStatus } from "../../../services/contract/profileActionService.js";
import { getHiringManagerPreview } from "../../../services/contract/profileService.js";
import { ContractError } from "../../../services/contract/openingService.js";

export async function shortlistProfile(req: Request, res: Response) {
  return updateStatus(req, res, ProfileStatus.SHORTLISTED);
}

export async function rejectProfile(req: Request, res: Response) {
  return updateStatus(req, res, ProfileStatus.REJECTED);
}

export async function previewHiringManagerProfile(req: Request, res: Response) {
  try {
    const preview = await getHiringManagerPreview((req as any).user, profileId(req.params.id));
    res.setHeader("Content-Type", preview.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${preview.fileName}"`);
    return preview.stream.pipe(res);
  } catch (error) {
    return sendError(res, error, "Failed to preview profile");
  }
}

async function updateStatus(
  req: Request,
  res: Response,
  status: "SHORTLISTED" | "REJECTED"
) {
  try {
    const profile = await setProfileStatus(
      (req as any).user,
      profileId(req.params.id),
      status
    );
    return res.json({
      success: true,
      message: status === ProfileStatus.SHORTLISTED ? "Profile shortlisted" : "Profile rejected",
      profile,
    });
  } catch (error) {
    return sendError(res, error, "Failed to update profile");
  }
}

function profileId(value: string) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id)) throw new ContractError(400, "Invalid profile ID");
  return id;
}

function sendError(res: Response, error: unknown, fallback: string) {
  const status = error instanceof ContractError ? error.statusCode : 500;
  const message = error instanceof ContractError ? error.message : fallback;
  return res.status(status).json({ message });
}
