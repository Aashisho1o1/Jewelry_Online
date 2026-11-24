// Starts the shop and the local CMS helper together; Ctrl+C stops both.
import { spawn } from 'node:child_process';

// Run the JS entry points directly: Windows .cmd shims leave orphaned processes on Ctrl+C.
const run = (entry, env) => spawn(process.execPath, [entry], { stdio: 'inherit', env: { ...process.env, ...env } });
// The helper has no password, so pin it to this machine whatever .env says.
const children = [
  run('node_modules/vite/bin/vite.js'),
  run('node_modules/decap-server/dist/index.js', { BIND_HOST: 'localhost', PORT: '8081' }),
];

const stop = () => children.forEach(child => child.kill());
children.forEach(child => child.on('exit', code => { stop(); process.exitCode ||= code ?? 0; }));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
console.log('\nCMS: http://localhost:5173/admin/\n');
