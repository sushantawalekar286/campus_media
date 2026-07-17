import fs from 'fs';

const serverFile = 'd:/campus_media/server/server.js';
if (fs.existsSync(serverFile)) {
  const content = fs.readFileSync(serverFile, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('io.') || line.includes('socket') || line.includes('Socket')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('Server file not found');
}
