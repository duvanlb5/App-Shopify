// Preload script:
// 1. Monkey-patch dns.lookup to strip "https?://" prefix — the Shopify SDK v13.1.0
//    passes the full appUrl to dns.lookup, which fails inside Fly containers.
// 2. Catch all fatal errors so SDK init bugs don't kill the process.
const dns = require('node:dns');
const originalLookup = dns.lookup;
dns.lookup = function patchedLookup(hostname, options, callback) {
  if (typeof hostname === 'string') {
    hostname = hostname.replace(/^https?:\/\//, '');
  }
  return originalLookup.call(dns, hostname, options, callback);
};

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
