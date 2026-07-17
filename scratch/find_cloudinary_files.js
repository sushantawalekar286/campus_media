import fs from 'fs';
import path from 'path';

function searchDir(dir, query) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(searchDir(fullPath, query));
      }
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.toLowerCase().includes(query)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const serverDir = 'd:/campus_media/server';
if (fs.existsSync(serverDir)) {
  const matches = searchDir(serverDir, 'cloudinary');
  console.log("Matches found:", matches);
} else {
  console.log("Server dir not found");
}
