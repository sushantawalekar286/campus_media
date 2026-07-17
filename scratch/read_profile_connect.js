import fs from 'fs';
import path from 'path';

const filePath = 'd:/campus_media/client/src/pages/Profile.jsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('/follow') || line.includes('connect') || line.includes('apiClient') || line.includes('unfollow')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('File not found');
}
