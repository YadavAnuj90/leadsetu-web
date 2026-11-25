const path = require('path');

const webRoot = path.resolve(__dirname, '..');
const apiRoot =
  process.env.LEADSETU_API_DIR ||
  path.resolve(webRoot, '..', '..', 'leadsetu-api', 'leadsetu-api');

module.exports = {
  apps: [
    {
      name: 'leadsetu-api',
      cwd: apiRoot,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '900M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      out_file: path.join(apiRoot, 'logs', 'pm2-out.log'),
      error_file: path.join(apiRoot, 'logs', 'pm2-error.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'leadsetu-web',
      cwd: webRoot,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '900M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: '/var/log/pm2/leadsetu-web-out.log',
      error_file: '/var/log/pm2/leadsetu-web-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
