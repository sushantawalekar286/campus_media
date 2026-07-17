import fs from 'fs';

const filePath = 'd:/campus_media/server/controllers/userController.js';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('updateProfilePicture') || line.includes('updateCoverPicture')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('File not found');
}
