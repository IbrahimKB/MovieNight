export async function register() {
  // Only initialize in Node.js runtime (not in Edge/Middleware)
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  // Skip cron jobs during build and export phases
  const buildPhases = [
    'phase-production-build',
    'phase-export',
  ];

  if (buildPhases.includes(process.env.NEXT_PHASE || '')) {
    console.log(`[CRON] Skipped initialization during ${process.env.NEXT_PHASE}`);
    return;
  }

  try {
    const { initCronJobs } = await import('@/lib/cron');
    initCronJobs();
    console.log('[CRON] Successfully initialized');
  } catch (error) {
    console.error('[CRON] Failed to initialize cron jobs:', error);
    // Don't crash the app if cron fails to initialize
  }
}
