// Preload script: catch all fatal errors so SDK init bugs don't kill the process.
// Runs before any other module is loaded.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
  // do NOT re-throw — keep the process alive so we can still serve requests
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason && reason.stack ? reason.stack : reason);
  // do NOT re-throw
});

process.on('exit', (code) => {
  console.error(`[process exit] code=${code}`);
});
