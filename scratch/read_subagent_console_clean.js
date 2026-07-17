import fs from 'fs';

const transcriptPath = 'C:/Users/Sushant/.gemini/antigravity-ide/brain/0ed08d7e-7204-4fd4-8026-600119390cdf/.system_generated/logs/transcript.jsonl';
if (fs.existsSync(transcriptPath)) {
  const content = fs.readFileSync(transcriptPath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (lower.includes('delete') || lower.includes('posts/')) {
      console.log(line.substring(0, 400) + '...');
    }
  });
} else {
  console.log('Transcript not found');
}
