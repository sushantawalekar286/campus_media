import dotenv from 'dotenv';
dotenv.config();
import { tokenService } from '../server/services/tokenService.js';

async function run() {
  const user = { _id: '6a528e48ee55bfc2b5cc36a4', role: 'USER', email: 'test@gmail.com' };
  const token = tokenService.generateAccessToken(user);
  console.log('Token generated:', token);
  const verified = tokenService.verifyAccessToken(token);
  console.log('Verified:', verified);
}

run();
