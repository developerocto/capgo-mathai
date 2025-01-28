module.exports = {
  apps: [
      {
          name: 'server',
          script: 'yarn',
          args: 'backend',
          interpreter: 'none',
          autorestart: true,
          restart_delay: 5000
      }
  ]
};
