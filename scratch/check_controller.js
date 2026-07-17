import { userController } from '../server/controllers/userController.js';

console.log('userController keys:', Object.keys(userController));
console.log('typeof getDiscoverUsers:', typeof userController.getDiscoverUsers);
console.log('typeof getByUsername:', typeof userController.getByUsername);
console.log('typeof getSuggestions:', typeof userController.getSuggestions);
