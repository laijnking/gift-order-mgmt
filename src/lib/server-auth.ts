import { NextRequest, NextResponse } from 'next/server';

export type ServerAuthUser = {
  id?: string;
  username?: string;
  role?: string;
  dataScope?: string;
  permissions?: string[];
};

function parseUserInfoHeader(request: NextRequest): ServerAuthUser | null {
  const raw = request.headers.get('x-user-info');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ServerAuthUser;
    return {
      ...parsed,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
    };
  } catch {
    return null;
  }
}

export function getRequestUser(request: NextRequest) {
  return parseUserInfoHeader(request);
}

export function requirePermission(request: NextRequest, permission: string) {
  const user = parseUserInfoHeader(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: '未登录或缺少用户上下文' },
      { status: 401 }
    );
  }

  if (!user.permissions?.includes(permission)) {
    return NextResponse.json(
      { success: false, error: '当前账号没有执行此操作的权限' },
      { status: 403 }
    );
  }

  return null;
}
