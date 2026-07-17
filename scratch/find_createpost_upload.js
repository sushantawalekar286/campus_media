import fs from 'fs';

const filePath = 'd:/campus_media/client/src/pages/CreatePostPage.jsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('upload') || line.includes('api') || line.includes('handleSubmit') || line.includes('media')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('File not found');
}
