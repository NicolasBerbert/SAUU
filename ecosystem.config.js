// Configuração do PM2 para produção na Oracle VM
module.exports = {
  apps: [
    {
      name: "sauu",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 2,         // Usar 2 dos 4 cores ARM disponíveis
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
