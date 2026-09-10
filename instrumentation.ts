const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureSchema } = await import('./lib/schema');
    const { startChecker } = await import('./lib/checker');

    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await ensureSchema();
        break;
      } catch (e) {
        if (attempt === maxAttempts) throw e;
        const delay = Math.min(1000 * 2 ** (attempt - 1), 30000);
        console.error(
          `[gloomymonitor] DB connection failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`,
          e
        );
        await sleep(delay);
      }
    }

    startChecker();
  }
}
