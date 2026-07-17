import fs from 'fs';

const filePath = 'd:/campus_media/client/src/components/PostCard.jsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('project') || line.includes('achievement') || line.includes('resource') || line.includes('postType')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('PostCard file not found');
}
