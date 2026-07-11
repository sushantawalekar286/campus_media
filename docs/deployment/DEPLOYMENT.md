# Deployment Guide

This document explains the steps to configure, build, and deploy the Campus Media platform to production hosting environments.

---

## 🏗️ Production Build Step
Before deploying, compile the React frontend SPA and bundle the Express backend:
```bash
# Install production and development dependencies
npm install

# Run the build script
npm run build
```
This script:
1. Compiles frontend assets and writes them to the `dist/` directory.
2. Uses `esbuild` to compile `server/server.js` into a unified `dist/server.cjs` file.

---

## 🚀 Hosting Methods

### 1. Process Management (PM2)
We recommend using a process manager like PM2 to run the application on virtual machines (such as AWS EC2 or DigitalOcean Droplets):
```bash
# Install PM2 globally
npm install pm2 -g

# Start the application
pm2 start dist/server.cjs --name "campus-media"

# Configure PM2 to start automatically on system boot
pm2 startup
pm2 save
```

### 2. Reverse Proxy (Nginx)
Configure Nginx as a reverse proxy to route traffic from port 80/443 to the Express backend running on port 3000:
```nginx
server {
    listen 80;
    server_name campusmedia.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 Production Environment Variables
Configure these variables in your hosting environment (do not save them in a `.env` file in the code repository):
* `MONGO_URI`: Production MongoDB Atlas connection string.
* `JWT_SECRET`: A long, cryptographically strong random string.
* `GEMINI_API_KEY`: Active Google Gemini API key.
* `NODE_ENV`: Set to `production` to serve compiled assets.
