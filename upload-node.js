#!/usr/bin/env node
// upload-node.js
// Small Node utility to create a card HTML file and update data/<section>Library.json
// Usage (PowerShell):
//   node upload-node.js --title "Title" --content "The content" --section leaf --id 123
// If run without args it will create a sample card.

const fs = require('fs');
const path = require('path');

// Debug helper: print current working directory when script runs
console.log('[upload-node] cwd=', process.cwd());

function usage(){
  console.log('Usage: node upload-node.js --title "Title" --content "Text" --section <leaf|lotus> [--id ID]');
  console.log('When no args are provided a sample card is written to cards/card_sample.html and data/sampleLibrary.json');
}

function parseArgs(){
  const args = process.argv.slice(2);
  const out = {};
  for(let i=0;i<args.length;i++){
    const a = args[i];
    if(a === '--title') out.title = args[++i];
    else if(a === '--content') out.content = args[++i];
    else if(a === '--section') out.section = args[++i];
    else if(a === '--id') out.id = args[++i];
    else if(a === '--help' || a === '-h'){ usage(); process.exit(0); }
  }
  return out;
}

function ensureDir(dir){ if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive:true }); }

function safeReadJson(filePath){ try{ if(!fs.existsSync(filePath)) return []; const raw = fs.readFileSync(filePath,'utf8'); return JSON.parse(raw || '[]'); }catch(e){ console.error('JSON parse error for', filePath, e); return []; } }

function safeWriteJson(filePath, obj){ try{ const dir = path.dirname(filePath); ensureDir(dir); fs.writeFileSync(filePath, JSON.stringify(obj, null, 2),'utf8'); }catch(e){ console.error('Failed to write', filePath, e); } }

function createCardHtml(card){
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(card.title)}</title>
  <link rel="stylesheet" href="../css/style1.css">
</head>
<body>
  <main>
    <article>
      <h1>${escapeHtml(card.title)}</h1>
      <div>${escapeHtml(card.content).replace(/\n/g,'<br>')}</div>
    </article>
  </main>
</body>
</html>`;
  return html;
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function writeCard(card, outDir='cards'){
  ensureDir(outDir);
  const id = card.id || ('card_' + Date.now());
  const filename = path.join(outDir, `card_${id}.html`);
  const abs = path.resolve(filename);
  fs.writeFileSync(filename, createCardHtml(card), 'utf8');
  console.log('[upload-node] Wrote', filename, '(abs:', abs + ')');
  return abs;
}

function updateLibrary(card, section){
  const dataDir = path.join('data'); ensureDir(dataDir);
  const libPath = path.join(dataDir, `${section}Library.json`);
  const arr = safeReadJson(libPath);
  const entry = { id: card.id || ('card_' + Date.now()), title: card.title, content: card.content, section: section, ts: Date.now() };
  arr.push(entry);
  safeWriteJson(libPath, arr);
  console.log('Updated', libPath);
}

// Main
(function main(){
  const args = parseArgs();
  if(!args.title || !args.content || !args.section){
    console.log('No full args detected. Creating a sample card...');
    const sample = { id: 'sample', title:'Sample Card', content:'This is a sample card created by upload-node.js', section:'leaf' };
    writeCard(sample, 'cards');
    updateLibrary(sample, 'sample');
    console.log('\nDone. To use the script for real cards, run with --title --content --section.');
    process.exit(0);
  }

  const card = { id: args.id || ('' + Date.now()), title: args.title, content: args.content };
  writeCard(card, 'cards');
  updateLibrary(card, args.section);
  console.log('Finished.');
})();
