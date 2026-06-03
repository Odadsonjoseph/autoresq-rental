const { Client } = require('ssh2');

const conn = new Client();

const VPS_HOST = '74.208.55.31';
const VPS_USER = 'root';
const VPS_PASS = 'h4HKfRd5lEfNrIy';

console.log(`Connecting to ${VPS_HOST}...`);

conn.on('ready', () => {
  console.log('SSH Connection established');

  // Check Caddy config and more details
  const commands = [
    'cat /etc/caddy/Caddyfile 2>/dev/null || cat /root/.config/caddy/Caddyfile 2>/dev/null',
    'ls -la /root/autoresq-rental/',
    'file /root/autoresq-rental/index.html',
    'head -30 /root/autoresq-rental/index.html',
    'systemctl status lovable-agent 2>&1 | head -20',
    'curl -s http://localhost:3000 2>&1 | head -10',
    'netstat -tlnp 2>/dev/null | grep -E "(3000|80|443)" || ss -tlnp | grep -E "(3000|80|443)"'
  ];

  let cmdIdx = 0;

  function runNext() {
    if (cmdIdx >= commands.length) {
      conn.end();
      return;
    }

    const cmd = commands[cmdIdx++];
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.log(`Error running "${cmd}":`, err.message);
        runNext();
        return;
      }

      let output = '';
      stream.on('data', (data) => { output += data.toString(); });
      stream.on('close', () => {
        console.log(`\n--- ${cmd} ---`);
        console.log(output || '(empty)');
        runNext();
      });
    });
  }

  runNext();

}).on('error', (err) => {
  console.log('Connection error:', err.message);
}).connect({
  host: VPS_HOST,
  port: 22,
  username: VPS_USER,
  password: VPS_PASS,
  readyTimeout: 30000,
  strictKeyChecking: false
});
