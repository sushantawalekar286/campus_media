import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve .env from project root (one level up from server/)
const currentFileUrl = (typeof import.meta !== 'undefined' && import.meta.url) ? import.meta.url : null;
const __dirnamePath = currentFileUrl 
  ? path.dirname(fileURLToPath(currentFileUrl)) 
  : __dirname;
dotenv.config({ path: path.resolve(__dirnamePath, '..', '.env') });
console.log('🌱 Environment variables loaded successfully.');
