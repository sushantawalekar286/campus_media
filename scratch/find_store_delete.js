import fs from 'fs';
import path from 'path';

const storeDir = 'd:/campus_media/client/src/store';
if (fs.existsSync(storeDir)) {
  const files = fs.readdirSync(storeDir);
  files.forEach(file => {
    const filePath = path.join(storeDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('deletePost') || content.includes('usePostStore')) {
      console.log(`Found in: ${file}`);
      // Find matching lines
      content.split('\n').forEach((line, idx) => {
        if (line.includes('deletePost')) {
          console.log(`  ${idx + 1}: ${line.trim()}`);
        }
      });
    }
  });
} else {
  console.log('Store directory not found');
}
