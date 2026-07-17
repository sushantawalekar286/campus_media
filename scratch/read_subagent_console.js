import fs from 'fs';
import path from 'path';

const transcriptPath = 'C:/Users/Sushant/.gemini/antigravity-ide/brain/0ed08d7e-7204-4fd4-8026-600119390cdf/.system_generated/logs/transcript.jsonl';
if (fs.existsSync(transcriptPath)) {
  const content = fs.readFileSync(transcriptPath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('console') || line.includes('CONSOLE') || line.includes('Failed to delete')) {
      // Print snippets of lines that contain console errors
      if (line.length > 500) {
        console.log(line.substring(0, 300) + '...');
      } else {
        console.log(line);
      }
    }
  });
} else {
  console.log('Transcript not found');
}
