const COOKIE_NAME = 'site_monitor_session';
const SESSION_DAYS = 7;

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToArrayBuffer(base64UrlString: string): ArrayBuffer {
  const padded = base64UrlString + '='.repeat((4 - (base64UrlString.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(username: string, secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${username}|${expiresAt}`;
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${arrayBufferToBase64Url(new TextEncoder().encode(payload).buffer)}.${arrayBufferToBase64Url(signature)}`;
}

export async function verifySessionToken(
  token: string,
  expectedUsername: string,
  secret: string
): Promise<boolean> {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return false;

  const payload = new TextDecoder().decode(base64UrlToArrayBuffer(payloadPart));
  const [username, expiresAtStr] = payload.split('|');
  if (username !== expectedUsername) return false;
  if (Date.now() > Number(expiresAtStr)) return false;

  const key = await hmacKey(secret);
  return crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToArrayBuffer(signaturePart),
    new TextEncoder().encode(payload)
  );
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
