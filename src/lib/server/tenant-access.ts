import { TenantRole } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "@/lib/database/prisma";
import { getActiveTenantCookieName } from "@/lib/auth/jwt";

export type TenantAccess = {
  id: string;
  slug: string;
  name: string;
  role: TenantRole;
};

export async function getActiveTenantAccess(userId: string): Promise<TenantAccess | null> {
  const cookieStore = await cookies();
  const activeTenantSlug = cookieStore.get(getActiveTenantCookieName())?.value;

  if (!activeTenantSlug) return null;

  const tenant = await prisma.tenant.findFirst({
    where: {
      slug: activeTenantSlug,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              revokedAt: null,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      ownerId: true,
      members: {
        where: {
          userId,
          revokedAt: null,
        },
        select: {
          role: true,
        },
        take: 1,
      },
    },
  });

  if (!tenant) return null;

  const role = tenant.ownerId === userId ? TenantRole.OWNER : tenant.members[0]?.role;
  if (!role) return null;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    role,
  };
}

export function hasTenantRole(access: TenantAccess, allowed: TenantRole[]): boolean {
  return allowed.includes(access.role);
}
