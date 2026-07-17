import fs from 'fs';
import path from 'path';

function findContexts(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findContexts(fullPath));
    } else if (file.toLowerCase().includes('context')) {
      results.push(fullPath);
    }
  });
  return results;
}

const clientDir = 'd:/campus_media/client/src';
console.log("Context files found:", findContexts(clientDir));
