import { spawn } from 'child_process';

const FROM = process.env.MAIL_FROM || 'alerts@example.com';
const SENDMAIL_PATH = process.env.SENDMAIL_PATH || 'sendmail';

export function sendMail(to: string[], subject: string, bodyText: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (to.length === 0) {
      resolve();
      return;
    }

    const headers = [
      `From: ${FROM}`,
      `To: ${to.join(', ')}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      bodyText,
    ].join('\r\n');

    const proc = spawn(SENDMAIL_PATH, ['-t', '-oi']);
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`sendmail exited with code ${code}: ${stderr}`));
    });
    proc.stdin.write(headers);
    proc.stdin.end();
  });
}
