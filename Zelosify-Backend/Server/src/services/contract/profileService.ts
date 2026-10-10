import { ProfileStatus } from "@prisma/client";
import prisma from "../../config/prisma/prisma.js";
import {
  getProfileContentType,
  sanitizeFilename,
} from "../../helpers/vendorRequestValidation.js";
import { createStorageService } from "../storage/storageFactory.js";
import { recommendationService } from "../ai/recommendationService.js";
import { ContractError, fileNameFromKey, UserContext } from "./openingService.js";

export async function presignProfiles(
  user: UserContext,
  openingId: string,
  filenames: unknown
) {
  if (!Array.isArray(filenames) || filenames.length === 0 || filenames.length > 10) {
    throw new ContractError(400, "One to ten filenames are required");
  }
  await requireOpening(user, openingId);
  const storage = createStorageService();
  return Promise.all(
    filenames.map(async (value, index) => {
      if (typeof value !== "string") throw new ContractError(400, "Invalid filename");
      const fileName = sanitizeFilename(value);
      const contentType = getProfileContentType(fileName);
      if (!contentType) throw new ContractError(400, "Only PDF and PPTX files are allowed");
      const s3Key = `${user.tenantId}/${openingId}/${Date.now() + index}_${fileName}`;
      return {
        fileName,
        s3Key,
        contentType,
        uploadUrl: await storage.getUploadURL(s3Key, contentType),
      };
    })
  );
}

export async function submitProfiles(user: UserContext, openingId: string, s3Keys: unknown) {
  if (!Array.isArray(s3Keys) || s3Keys.length === 0 || s3Keys.length > 10) {
    throw new ContractError(400, "One to ten uploaded file keys are required");
  }
  await requireOpening(user, openingId);
  const prefix = `${user.tenantId}/${openingId}/`;
  const keys = s3Keys.map((key) => {
    if (typeof key !== "string" || !key.startsWith(prefix) || !getProfileContentType(key)) {
      throw new ContractError(400, "Invalid uploaded file key");
    }
    return key;
  });
  const storage = createStorageService();
  const exists = await Promise.all(keys.map((key) => storage.objectExists(key)));
  if (exists.some((value) => !value)) throw new ContractError(400, "An uploaded file was not found");

  const profiles = await prisma.$transaction(
    keys.map((s3Key) =>
      prisma.hiringProfile.create({
        data: {
          openingId,
          s3Key,
          uploadedBy: user.id,
          status: ProfileStatus.SUBMITTED,
          isDeleted: false,
        },
      })
    )
  );
  setImmediate(() => {
    for (const profile of profiles) {
      recommendationService.processRecommendation(profile.id, user.tenantId).catch((error) => {
        console.error(
          JSON.stringify({
            event: "AI_RECOMMENDATION_DISPATCH_ERROR",
            profileId: profile.id,
            error: error instanceof Error ? error.message : String(error),
          })
        );
      });
    }
  });
  return profiles;
}

export async function softDeleteProfile(user: UserContext, profileId: number) {
  const profile = await prisma.hiringProfile.findFirst({
    where: {
      id: profileId,
      uploadedBy: user.id,
      opening: { tenantId: user.tenantId },
    },
  });
  if (!profile) throw new ContractError(404, "Profile not found");
  return prisma.hiringProfile.update({
    where: { id: profile.id, opening: { tenantId: user.tenantId } },
    data: { isDeleted: true },
  });
}

export async function getVendorPreview(user: UserContext, profileId: number) {
  return getPreview({
    id: profileId,
    uploadedBy: user.id,
    isDeleted: false,
    opening: { tenantId: user.tenantId },
  });
}

export async function getHiringManagerPreview(user: UserContext, profileId: number) {
  return getPreview({
    id: profileId,
    isDeleted: false,
    opening: { tenantId: user.tenantId, hiringManagerId: user.id },
  });
}

async function getPreview(where: any) {
  const profile = await prisma.hiringProfile.findFirst({ where });
  if (!profile) throw new ContractError(404, "Profile not found");
  const contentType = getProfileContentType(profile.s3Key);
  if (!contentType) throw new ContractError(415, "Unsupported profile file type");
  return {
    stream: await createStorageService().getObjectStream(profile.s3Key),
    fileName: fileNameFromKey(profile.s3Key),
    contentType,
  };
}

async function requireOpening(user: UserContext, openingId: string) {
  const opening = await prisma.opening.findFirst({
    where: { id: openingId, tenantId: user.tenantId },
    select: { id: true },
  });
  if (!opening) throw new ContractError(404, "Opening not found in your tenant");
}
