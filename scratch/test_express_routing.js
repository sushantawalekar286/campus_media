import express from 'express';
import userRoutes from '../server/routes/userRoutes.js';

const app = express();
app.use('/api/users', userRoutes);

console.log('--- Registered Routes on /api/users ---');
function printRoutes(pathPrefix, router) {
  router.stack.forEach((layer) => {
    if (layer.route) {
      // Simple route
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      console.log(`[${methods}] ${pathPrefix}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Nested router
      printRoutes(pathPrefix + (layer.regexp.source || ''), layer.handle);
    }
  });
}

printRoutes('/api/users', userRoutes);
