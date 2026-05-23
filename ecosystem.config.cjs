module.exports = {
  apps: [
    {
      name: 'digital-legacy-obs-menu',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3456,
        TRUST_PROXY: 'true',
      },
    },
  ],
};
