import fs from 'fs';

const userModel = 'd:/campus_media/server/models/User.js';
if (fs.existsSync(userModel)) {
  const content = fs.readFileSync(userModel, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('projects') || line.includes('achievements') || line.includes('media')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('User model file not found');
}
