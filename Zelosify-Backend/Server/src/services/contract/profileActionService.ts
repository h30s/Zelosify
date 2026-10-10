import { ProfileStatus } from "@prisma/client";
import prisma from "../../config/prisma/prisma.js";
import { ContractError, UserContext } from "./openingService.js";

export async function setProfileStatus(
  user: UserContext,
  profileId: number,
  status: "SHORTLISTED" | "REJECTED"
) {
  const profile = await prisma.hiringProfile.findFirst({
    where: {
      id: profileId,
      isDeleted: false,
      opening: { tenantId: user.tenantId, hiringManagerId: user.id },
    },
    select: { id: true },
  });
  if (!profile) throw new ContractError(404, "Profile not found or permission denied");
  const shortlisted = status === ProfileStatus.SHORTLISTED;
  return prisma.$transaction((tx) =>
    tx.hiringProfile.update({
      where: {
        id: profile.id,
        opening: { tenantId: user.tenantId, hiringManagerId: user.id },
      },
      data: {
        status,
        shortlistedBy: shortlisted ? user.id : null,
        shortlistedAt: shortlisted ? new Date() : null,
        rejectedBy: shortlisted ? null : user.id,
        rejectedAt: shortlisted ? null : new Date(),
      },
    })
  );
}
