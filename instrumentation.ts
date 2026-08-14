export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureSchema } = await import('./lib/schema');
    const { startChecker } = await import('./lib/checker');
    await ensureSchema();
    startChecker();
  }
}
