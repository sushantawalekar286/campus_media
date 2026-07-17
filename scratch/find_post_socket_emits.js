import fs from 'fs';

const controllerFile = 'd:/campus_media/server/controllers/postController.js';
if (fs.existsSync(controllerFile)) {
  const content = fs.readFileSync(controllerFile, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('emit') || line.includes('socket') || line.includes('Socket') || line.includes('io.')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('Post controller file not found');
}
