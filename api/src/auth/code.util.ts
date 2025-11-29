// src/auth/code.util.ts
import * as bcrypt from 'bcrypt';

export function genNumericCode(len = 6) {
  const min = 10 ** (len - 1);
  const max = 10 ** len - 1;
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(num);
}

export async function hashCode(plain: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyCodeHash(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
