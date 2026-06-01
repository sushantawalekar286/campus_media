import fs from 'fs';
import pdfParse from 'pdf-parse';

async function parsePDF(buffer) {
  try {
    let fn = pdfParse;
    console.log("Loaded pdf-parse object type:", typeof fn);
    console.log("Keys of loaded pdf-parse object:", fn ? Object.keys(fn) : 'null');
    
    if (fn && fn.PDFParse) {
      console.log("Using PDFParse v2 class to extract text");
      const parser = new fn.PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result;
    }
    if (typeof fn === 'function') {
      console.log("Using pdf-parse v1 function to extract text");
      return await fn(buffer);
    } else if (fn && typeof fn.default === 'function') {
      console.log("Using pdf-parse v1 default function to extract text");
      return await fn.default(buffer);
    }
    throw new Error('pdf-parse is not a function or class. Loaded object keys: ' + (fn ? Object.keys(fn).join(', ') : 'null'));
  } catch (err) {
    console.error("Error during PDF parsing fallback:", err);
    throw err;
  }
}

async function testParse() {
  try {
    const buffer = fs.readFileSync('scratch/dummy.pdf');
    const result = await parsePDF(buffer);
    console.log("Parsed result:", typeof result);
    console.log("Extracted text snippet:", result.text ? result.text.slice(0, 200) : 'no text');
  } catch (error) {
    console.error("PDF parse failed:", error);
  }
}

testParse();
