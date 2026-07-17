import fs from 'fs';

const filePath = 'd:/campus_media/server/controllers/userController.js';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('Project') || line.includes('Achievement') || line.includes('projects') || line.includes('achievements') || line.includes('populate')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('User controller file not found');
}
