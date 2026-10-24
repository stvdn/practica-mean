export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('Configure JWT_SECRET con al menos 32 bytes.');
  }
  return secret;
}
