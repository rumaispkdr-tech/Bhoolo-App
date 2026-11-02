import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'quiz-exam-saas-platform-secure-secret-key-2026';
const COOKIE_NAME = 'quiz_auth_token';

export interface AuthSession {
  id: string;
  role: 'admin' | 'student';
  name: string;
  email?: string;
  admissionNumber?: string;
  class?: string;
  division?: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function signAuthToken(payload: AuthSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

export function parseTokenFromHeader(header: string | null): AuthSession | null {
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.substring(7);
  return verifyAuthToken(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
