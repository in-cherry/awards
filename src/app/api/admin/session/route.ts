import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/app/api/admin/_shared/require-admin-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ('response' in auth) {
    const status = auth.response.status;
    return NextResponse.json({ authenticated: false }, { status });
  }

  const tenantSlug = request.nextUrl.searchParams.get('tenantSlug');
  if (tenantSlug && tenantSlug !== auth.tenant.slug) {
    return NextResponse.json({ authenticated: false }, { status: 403 });
  }

  return NextResponse.json({
    authenticated: true,
    tenantId: auth.tenant.id,
    tenantSlug: auth.tenant.slug,
    userId: auth.user.id,
  });
}
