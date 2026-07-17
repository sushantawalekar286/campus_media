import fs from 'fs';

const filePath = 'd:/campus_media/client/src/pages/Profile.jsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('user.projects') || line.includes('user.achievements') || line.includes('projects.map') || line.includes('achievements.map')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('Profile file not found');
}
