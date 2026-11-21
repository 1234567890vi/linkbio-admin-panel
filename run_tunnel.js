const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const TUNNEL_URL_FILE = path.join(__dirname, 'tunnel_url.txt');

async function start() {
  const subdomain = 'biocraft-' + Math.floor(100000 + Math.random() * 900000);
  console.log(`[Tunnel] Requesting subdomain: ${subdomain}...`);

  try {
    const tunnel = await localtunnel({
      port: 8000,
      subdomain: subdomain
    });

    console.log('[Tunnel Online]: ' + tunnel.url);
    fs.writeFileSync(TUNNEL_URL_FILE, tunnel.url, 'utf8');

    tunnel.on('close', () => {
      console.log('[Tunnel Closed]');
      setTimeout(start, 2000);
    });

    tunnel.on('error', (err) => {
      console.error('[Tunnel Error]:', err);
      setTimeout(start, 2000);
    });
  } catch (err) {
    console.error('[Init Error]:', err);
    setTimeout(start, 3000);
  }
}

start();

// Keep process active
setInterval(() => {}, 60000);
