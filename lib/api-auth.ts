import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

type Role = 'admin' | 'sarpras' | 'perpus' | 'kepala_sekolah';

export async function authProtectedEndpoint(
  request: NextRequest,
  handler: (request: NextRequest, token: { id: string; role: string; name: string }) => Promise<NextResponse>,
  allowedRoles?: Role[]
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (allowedRoles && !allowedRoles.includes(token.role as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return await handler(request, {
      id: token.id as string,
      role: token.role as string,
      name: token.name as string,
    });
  } catch (error) {
    console.error('API Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
