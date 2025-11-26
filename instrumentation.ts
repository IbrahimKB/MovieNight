export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only import and run cron in Node.js environment
    const { initCronJobs } = await import('@/lib/cron');
    
    // Prevent running during build
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      initCronJobs();
    }
  }
}
