module.exports = {
  apps: [
    {
      name: 'namegame-web',
      script: 'sh',
      args: '-c "cd apps/web && npm start"',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true
    },
    {
      name: 'namegame-worker',
      script: 'sh',
      args: '-c "cd apps/worker && npm start"',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true
    },
    {
      name: 'namegame-chat',
      script: 'sh',
      args: '-c "cd apps/chat && npm start"',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        CHAT_PORT: 3001
      },
      error_file: './logs/chat-error.log',
      out_file: './logs/chat-out.log',
      log_file: './logs/chat-combined.log',
      time: true
    }
  ]
};
