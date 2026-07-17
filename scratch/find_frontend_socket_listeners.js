import fs from 'fs';
import path from 'path';

function searchDir(dir, query) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(searchDir(fullPath, query));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes(query) || content.toLowerCase().includes('socket.')) {
        results.push({ file: fullPath, content });
      }
    }
  });
  return results;
}

const clientDir = 'd:/campus_media/client/src';
if (fs.existsSync(clientDir)) {
  const matches = searchDir(clientDir, 'socket');
  matches.forEach(m => {
    console.log(`File: ${m.file}`);
    m.content.split('\n').forEach((line, idx) => {
      if (line.includes('.on(') || line.includes('socket') || line.includes('Socket')) {
        console.log(`  ${idx + 1}: ${line.trim()}`);
      }
    });
  });
} else {
  console.log("Client dir not found");
}
