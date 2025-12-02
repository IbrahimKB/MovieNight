export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Use require to avoid webpack bundling node-cron
    const { initCronJobs } = require("./lib/cron");
    await initCronJobs();
  }
}
