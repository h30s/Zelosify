import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { ProfileStatus } from "@prisma/client";

// In-memory data store for integration test flow
const mockOpenings: any[] = [];
const mockProfiles: any[] = [];
let nextProfileId = 1;

vi.mock("../../src/config/prisma/prisma.js", () => {
  const mockPrisma = {
    opening: {
      findFirst: vi.fn(async ({ where }: any) => {
        return mockOpenings.find(
          (o) =>
            o.id === where.id &&
            (!where.tenantId || o.tenantId === where.tenantId) &&
            (!where.hiringManagerId || o.hiringManagerId === where.hiringManagerId)
        ) || null;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        return mockOpenings.find((o) => o.id === where.id) || null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return mockOpenings.filter((o) => {
          if (where.tenantId && o.tenantId !== where.tenantId) return false;
          if (where.id && o.id !== where.id) return false;
          return true;
        });
      }),
      create: vi.fn(async ({ data }: any) => {
        mockOpenings.push(data);
        return data;
      }),
    },
    hiringProfile: {
      findFirst: vi.fn(async ({ where, select, include }: any) => {
        const profile = mockProfiles.find((p) => {
          const opening = mockOpenings.find((o) => o.id === p.openingId);
          return (
            p.id === where.id &&
            (where.uploadedBy === undefined || p.uploadedBy === where.uploadedBy) &&
            (where.isDeleted === undefined || p.isDeleted === where.isDeleted) &&
            (!where.opening?.tenantId || opening?.tenantId === where.opening.tenantId) &&
            (!where.opening?.hiringManagerId ||
              opening?.hiringManagerId === where.opening.hiringManagerId)
          );
        });
        if (!profile) return null;
        if (select) return { id: profile.id };
        if (include?.opening) {
          return {
            ...profile,
            opening: mockOpenings.find((opening) => opening.id === profile.openingId),
          };
        }
        return profile;
      }),
      findUnique: vi.fn(async ({ where, include }: any) => {
        const profile = mockProfiles.find((p) => p.id === where.id);
        if (!profile) return null;
        if (include?.opening) {
          const opening = mockOpenings.find((o) => o.id === profile.openingId);
          return { ...profile, opening };
        }
        return { ...profile };
      }),
      findMany: vi.fn(async ({ where, include }: any) => {
        return mockProfiles
          .filter((p) => {
            if (where.openingId && p.openingId !== where.openingId) return false;
            if (where.isDeleted !== undefined && p.isDeleted !== where.isDeleted) return false;
            if (where.id && p.id !== where.id) return false;
            return true;
          })
          .map((p) => {
            if (include?.opening) {
              const opening = mockOpenings.find((o) => o.id === p.openingId);
              return { ...p, opening };
            }
            return { ...p };
          });
      }),
      create: vi.fn(async ({ data }: any) => {
        const newProfile = {
          id: nextProfileId++,
          ...data,
          submittedAt: new Date(),
          recommended: null,
          recommendationScore: null,
          recommendationReason: null,
          recommendationConfidence: null,
          recommendationLatencyMs: null,
          recommendationVersion: null,
          recommendedAt: null,
          shortlistedBy: null,
          shortlistedAt: null,
          rejectedBy: null,
          rejectedAt: null,
        };
        mockProfiles.push(newProfile);
        return newProfile;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = mockProfiles.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error("Profile not found");
        mockProfiles[idx] = { ...mockProfiles[idx], ...data };
        return mockProfiles[idx];
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const initialLen = mockProfiles.length;
        const remaining = mockProfiles.filter((p) => p.id !== where.id);
        mockProfiles.length = 0;
        mockProfiles.push(...remaining);
        return { count: initialLen - remaining.length };
      }),
    },
    $transaction: vi.fn(async (operation: any) => {
      return Array.isArray(operation) ? Promise.all(operation) : operation(mockPrisma);
    }),
  };

  return {
    default: mockPrisma,
    prisma: mockPrisma,
  };
});

vi.mock("../../src/services/storage/storageFactory.js", () => ({
  createStorageService: () => ({
    getUploadURL: vi.fn(async (key: string) => `https://upload.test/${key}`),
    objectExists: vi.fn(async () => true),
  }),
}));

// Import recommendation service after mock is established
import { recommendationService } from "../../src/services/ai/recommendationService.js";
import { presignProfiles, submitProfiles } from "../../src/services/contract/profileService.js";
import { setProfileStatus } from "../../src/services/contract/profileActionService.js";
import prisma from "../../src/config/prisma/prisma.js";

describe("Contract Hiring End-to-End Integration Flow", () => {
  const tenantId = "tenant-bruce-wayne";
  const vendorId = "usr-vendor-001";
  const hmId = "usr-hm-001";
  const openingId = "op-bwc-001";

  let createdProfileId: number;

  beforeAll(async () => {
    // Ensure test opening exists
    const opening = await prisma.opening.findUnique({ where: { id: openingId } });
    if (!opening) {
      await prisma.opening.create({
        data: {
          id: openingId,
          tenantId,
          title: "Senior Full Stack TypeScript Engineer",
          description: "Required skills: TypeScript, Node.js, React, Docker, AWS.",
          location: "Remote",
          contractType: "C2C",
          hiringManagerId: hmId,
          experienceMin: 5,
          experienceMax: 8,
        },
      });
    }
  });

  afterAll(async () => {
    // Cleanup created profile
    if (createdProfileId) {
      await prisma.hiringProfile.deleteMany({
        where: { id: createdProfileId },
      });
    }
  });

  it("Step 1: IT Vendor views available contract openings with tenant isolation", async () => {
    const openings = await prisma.opening.findMany({
      where: { tenantId },
    });
    expect(openings.length).toBeGreaterThan(0);
    expect(openings.every((o) => o.tenantId === tenantId)).toBe(true);
  });

  it("Step 2: IT Vendor submits candidate profile in Prisma transaction", async () => {
    const user = { id: vendorId, tenantId };
    const presigned = await presignProfiles(user, openingId, ["resume.pdf"]);
    expect(presigned[0].s3Key).toMatch(`${tenantId}/${openingId}/`);

    const recommendationSpy = vi
      .spyOn(recommendationService, "processRecommendation")
      .mockResolvedValue({});
    const [profile] = await submitProfiles(user, openingId, [presigned[0].s3Key]);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(recommendationSpy).toHaveBeenCalledWith(profile.id, tenantId);
    recommendationSpy.mockRestore();

    expect(profile).toBeDefined();
    expect(profile.id).toBeDefined();
    expect(profile.status).toBe(ProfileStatus.SUBMITTED);
    expect(profile.recommended).toBeNull();

    createdProfileId = profile.id;
  });

  it("Step 3: AI Recommendation Agent automatically evaluates profile and persists result", async () => {
    // Simulate candidate resume buffer with strong skills and experience
    const mockResumeText = `
      Senior Full Stack Engineer
      Summary: 6 years of experience in cloud native systems.
      Skills: TypeScript, Node.js, React, Docker, AWS, PostgreSQL.
      Location: Remote
      Education: B.S. in Computer Science
    `;
    const mockBuffer = Buffer.from(mockResumeText, "utf8");

    const updated = await recommendationService.processRecommendation(
      createdProfileId,
      tenantId,
      mockBuffer
    );

    expect(updated).toBeDefined();
    expect(updated.recommended).toBe(true);
    expect(updated.recommendationScore).toBeGreaterThanOrEqual(0.75);
    expect(updated.recommendationConfidence).toBeGreaterThan(0.7);
    expect(updated.recommendationReason).toContain("skill match");
    expect(updated.recommendationLatencyMs).toBeGreaterThanOrEqual(0);
    expect(updated.recommendationLatencyMs).toBeLessThan(2000); // Strict latency SLA
    expect(updated.recommendedAt).toBeInstanceOf(Date);
  });

  it("Step 4: Hiring Manager fetches opening profiles with AI recommendation badges", async () => {
    const profiles = await prisma.hiringProfile.findMany({
      where: { openingId, isDeleted: false },
      include: { opening: true },
    });

    const evaluated = profiles.find((p) => p.id === createdProfileId);
    expect(evaluated).toBeDefined();
    expect(evaluated!.recommended).toBe(true);
    expect(evaluated!.opening.hiringManagerId).toBe(hmId);
  });

  it("Step 5: Hiring Manager shortlists candidate in Prisma transaction", async () => {
    const shortlisted = await setProfileStatus(
      { id: hmId, tenantId },
      createdProfileId,
      ProfileStatus.SHORTLISTED
    );

    expect(shortlisted.status).toBe(ProfileStatus.SHORTLISTED);
    expect(shortlisted.shortlistedBy).toBe(hmId);
    expect(shortlisted.shortlistedAt).toBeInstanceOf(Date);
  });

  it("Step 6: IT Vendor soft deletes profile in Prisma transaction", async () => {
    const softDeleted = await prisma.$transaction(async (tx) => {
      return tx.hiringProfile.update({
        where: { id: createdProfileId },
        data: { isDeleted: true },
      });
    });

    expect(softDeleted.isDeleted).toBe(true);

    // Active profiles query must now exclude this profile
    const activeProfiles = await prisma.hiringProfile.findMany({
      where: { openingId, isDeleted: false, id: createdProfileId },
    });
    expect(activeProfiles.length).toBe(0);
  });
});
