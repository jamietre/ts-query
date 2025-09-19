#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cjsDir = path.join(__dirname, '..', 'dist', 'cjs');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace require("./file.js") with require("./file.cjs")
  content = content.replace(/require\("\.\/([^"]+)\.js"\)/g, 'require("./$1.cjs")');

  fs.writeFileSync(filePath, content);
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.cjs')) {
      fixImports(filePath);
      console.log(`Fixed imports in ${filePath}`);
    }
  }
}

if (fs.existsSync(cjsDir)) {
  processDirectory(cjsDir);
  console.log('CommonJS import fixing complete');
} else {
  console.log('CJS directory not found');
}