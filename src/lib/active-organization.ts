import { prisma } from "@/lib/db";

let cachedOrganizationId: string | null = null;

export async function getActiveOrganizationId(): Promise<string> {
  const configuredOrganizationId = process.env.ACTIVE_ORGANIZATION_ID?.trim();

  if (configuredOrganizationId) {
    return configuredOrganizationId;
  }

  if (cachedOrganizationId) {
    return cachedOrganizationId;
  }

  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  if (!organization) {
    throw new Error("Nenhuma organizacao encontrada. Rode o seed antes de usar o MVP.");
  }

  cachedOrganizationId = organization.id;
  return organization.id;
}
