import type { Metadata } from "next";
import prisma from "@/lib/database/prisma";

const DEFAULT_TENANT_DESCRIPTION = "... Um branding a ser definido pra atrair cliente pra plataforma...";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      name: true,
      metaTitle: true,
      metaDescription: true,
      favicon: true,
    },
  });

  const resolvedMetaTitle = tenant?.metaTitle?.trim() || tenant?.name || "InCherry";
  const resolvedDescription = tenant?.metaDescription?.trim() || DEFAULT_TENANT_DESCRIPTION;
  const resolvedFavicon = tenant?.favicon?.trim() || "/winzy_logo.png";

  return {
    title: `InCherry | ${resolvedMetaTitle}`,
    description: resolvedDescription,
    icons: {
      icon: resolvedFavicon,
      shortcut: resolvedFavicon,
      apple: resolvedFavicon,
    },
  };
}

export default function TenantPublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
