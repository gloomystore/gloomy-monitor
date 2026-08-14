module.exports = {
  apps: [
    {
      name: 'gloomymonitor',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 40022',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
