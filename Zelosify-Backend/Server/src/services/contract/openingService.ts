import { OpeningStatus } from "@prisma/client";
import prisma from "../../config/prisma/prisma.js";

export type UserContext = { id: string; tenantId: string };

export class ContractError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export async function listVendorOpenings(
  user: UserContext,
  query: { page?: string; limit?: string; search?: string; status?: string }
) {
  const page = Math.max(1, Number.parseInt(query.page || "", 10) || 1);
  const limit = Math.max(1, Math.min(100, Number.parseInt(query.limit || "", 10) || 10));
  const where: any = { tenantId: user.tenantId };
  if (query.status && Object.values(OpeningStatus).includes(query.status as OpeningStatus)) {
    where.status = query.status;
  }
  if (query.search) {
    where.OR = ["title", "location", "contractType"].map((field) => ({
      [field]: { contains: query.search, mode: "insensitive" },
    }));
  }

  const [total, openings] = await Promise.all([
    prisma.opening.count({ where }),
    prisma.opening.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { postedDate: "desc" },
    }),
  ]);
  const managerIds = [...new Set(openings.map((opening) => opening.hiringManagerId))];
  const managers = await prisma.user.findMany({
    where: { id: { in: managerIds }, tenantId: user.tenantId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  const names = new Map(
    managers.map((manager) => [
      manager.id,
      `${manager.firstName || ""} ${manager.lastName || ""}`.trim() || manager.email,
    ])
  );

  return {
    data: openings.map((opening) => ({
      id: opening.id,
      title: opening.title,
      description: opening.description,
      location: opening.location,
      contractType: opening.contractType,
      experienceMin: opening.experienceMin,
      experienceMax: opening.experienceMax,
      experienceRange: formatExperience(opening.experienceMin, opening.experienceMax),
      postedDate: opening.postedDate,
      status: opening.status,
      hiringManagerName: names.get(opening.hiringManagerId) || "Hiring Team",
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getVendorOpening(user: UserContext, openingId: string) {
  const opening = await prisma.opening.findFirst({
    where: { id: openingId, tenantId: user.tenantId },
  });
  if (!opening) throw new ContractError(404, "Opening not found");

  const [manager, profiles] = await Promise.all([
    prisma.user.findFirst({
      where: { id: opening.hiringManagerId, tenantId: user.tenantId },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.hiringProfile.findMany({
      where: {
        openingId,
        uploadedBy: user.id,
        isDeleted: false,
        opening: { tenantId: user.tenantId },
      },
      select: { id: true, s3Key: true, submittedAt: true, status: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  return {
    opening: {
      id: opening.id,
      title: opening.title,
      description: opening.description,
      location: opening.location,
      contractType: opening.contractType,
      status: opening.status,
      postedDate: opening.postedDate,
      expectedCompletionDate: opening.expectedCompletionDate,
    },
    hiringManagerName: manager
      ? `${manager.firstName || ""} ${manager.lastName || ""}`.trim() || manager.email
      : "Hiring Manager",
    experienceRange: formatExperience(opening.experienceMin, opening.experienceMax, "years"),
    profilesCount: profiles.length,
    uploadedProfiles: profiles.map((profile) => ({
      id: profile.id,
      fileName: fileNameFromKey(profile.s3Key),
      submittedAt: profile.submittedAt,
      status: profile.status,
    })),
  };
}

export async function listHiringManagerOpenings(user: UserContext) {
  const openings = await prisma.opening.findMany({
    where: { hiringManagerId: user.id, tenantId: user.tenantId },
    include: { _count: { select: { hiringProfiles: { where: { isDeleted: false } } } } },
    orderBy: { postedDate: "desc" },
  });
  return openings.map((opening) => ({
    id: opening.id,
    title: opening.title,
    description: opening.description,
    location: opening.location,
    contractType: opening.contractType,
    experienceMin: opening.experienceMin,
    experienceMax: opening.experienceMax,
    experienceRange: formatExperience(opening.experienceMin, opening.experienceMax),
    postedDate: opening.postedDate,
    status: opening.status,
    profilesCount: opening._count.hiringProfiles,
  }));
}

export async function getHiringManagerProfiles(user: UserContext, openingId: string) {
  const opening = await prisma.opening.findFirst({
    where: { id: openingId, hiringManagerId: user.id, tenantId: user.tenantId },
  });
  if (!opening) throw new ContractError(404, "Opening not found or permission denied");

  const profiles = await prisma.hiringProfile.findMany({
    where: { openingId, isDeleted: false, opening: { tenantId: user.tenantId } },
    orderBy: [{ recommendationScore: "desc" }, { submittedAt: "desc" }],
  });
  return {
    opening: {
      id: opening.id,
      title: opening.title,
      location: opening.location,
      contractType: opening.contractType,
      experienceMin: opening.experienceMin,
      experienceMax: opening.experienceMax,
    },
    profiles: profiles.map((profile) => ({
      id: profile.id,
      fileName: fileNameFromKey(profile.s3Key),
      submittedAt: profile.submittedAt,
      status: profile.status,
      badge: getBadge(profile.recommended, profile.recommendationScore),
      recommended: profile.recommended,
      score:
        profile.recommendationScore === null
          ? null
          : Math.round(profile.recommendationScore * 100),
      confidence:
        profile.recommendationConfidence === null
          ? null
          : Math.round(profile.recommendationConfidence * 100),
      explanation: profile.recommendationReason || "Pending AI evaluation...",
      latencyMs: profile.recommendationLatencyMs,
      shortlistedBy: profile.shortlistedBy,
      shortlistedAt: profile.shortlistedAt,
      rejectedBy: profile.rejectedBy,
      rejectedAt: profile.rejectedAt,
    })),
  };
}

export function fileNameFromKey(key: string) {
  return key.split("/").pop()?.replace(/^\d+_/, "") || "resume.pdf";
}

function formatExperience(min: number, max: number | null, unit = "yrs") {
  return `${min} - ${max === null ? `+ ${unit}` : `${max} ${unit}`}`;
}

function getBadge(recommended: boolean | null, score: number | null) {
  if (recommended) return "Recommended";
  if (score === null) return "Pending AI";
  return score >= 0.5 ? "Borderline" : "Not Recommended";
}
