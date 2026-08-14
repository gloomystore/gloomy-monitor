const COOKIE_NAME = 'site_monitor_session';
const SESSION_DAYS = 7;

function bufToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuf(str: string): ArrayBuffer {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
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
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${username}|${exp}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${bufToBase64Url(new TextEncoder().encode(payload).buffer)}.${bufToBase64Url(sig)}`;
}

export async function verifySessionToken(
  token: string,
  expectedUsername: string,
  secret: string
): Promise<boolean> {
  const [payloadPart, sigPart] = token.split('.');
  if (!payloadPart || !sigPart) return false;

  const payload = new TextDecoder().decode(base64UrlToBuf(payloadPart));
  const [username, expStr] = payload.split('|');
  if (username !== expectedUsername) return false;
  if (Date.now() > Number(expStr)) return false;

  const key = await hmacKey(secret);
  return crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBuf(sigPart),
    new TextEncoder().encode(payload)
  );
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
