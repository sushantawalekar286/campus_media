import fs from 'fs';
import path from 'path';

const modelsDir = 'd:/campus_media/server/models';
if (fs.existsSync(modelsDir)) {
  const files = fs.readdirSync(modelsDir);
  files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.toLowerCase().includes('post')) {
      console.log(`Found in model: ${file}`);
      content.split('\n').forEach((line, idx) => {
        if (line.includes('Post') || line.includes('post') || line.includes('Ref') || line.includes('ref')) {
          console.log(`  ${idx + 1}: ${line.trim()}`);
        }
      });
    }
  });
} else {
  console.log('Models dir not found');
}
