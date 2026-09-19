import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { HTTP_STATUS } from './constants';
import { prisma } from './db';
import { toUser } from './db/map';
import { env } from './config/env';
import { toPublicUser } from './helpers/response';
import type { AuthUser, UserRole } from './types';

export const ok = <T>(data: T, status: number = HTTP_STATUS.OK) =>
  NextResponse.json({ success: true, data }, { status });

export const fail = (message: string, status: number = HTTP_STATUS.BAD_REQUEST) =>
  NextResponse.json({ success: false, message }, { status });

export const readJson = async (req: Request): Promise<Record<string, unknown>> => {
  try {
    const body = await req.json();
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface JwtPayload {
  id: string;
}

export const getAuthUser = async (req: Request): Promise<AuthUser> => {
  const header = req.headers.get('authorization');

  if (!header?.startsWith('Bearer ')) {
    throw new HttpError('Потрібно увійти', HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as JwtPayload;
    const row = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!row) {
      throw new HttpError('Сесія закінчилась. Увійди знову', HTTP_STATUS.UNAUTHORIZED);
    }

    return toPublicUser(toUser(row)) as AuthUser;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError('Сесія закінчилась. Увійди знову', HTTP_STATUS.UNAUTHORIZED);
  }
};

export const requireRoles = (user: AuthUser, ...roles: UserRole[]) => {
  if (!roles.includes(user.role)) {
    throw new HttpError('Ця сторінка для іншої ролі', HTTP_STATUS.FORBIDDEN);
  }
};

export const handle = async (
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(error.message, error.status);
    }
    console.error(error);
    return fail('Щось пішло не так. Спробуй ще раз', HTTP_STATUS.INTERNAL);
  }
};
