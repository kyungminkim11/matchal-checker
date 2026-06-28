import fs from 'node:fs';
import path from 'node:path';

const html=fs.readFileSync(path.join(process.cwd(),'dist','index.html'),'utf8');
const terms=[
  'async function handleZip',
  'function parseZipEntries',
  'function inflateEntry',
  'function extractUsers',
  'function loadProgress',
  'function saveProgress',
  'function setStatus',
  'function markStatus',
  'function updateProgress',
  'function renderAll',
  'progressInput.addEventListener',
  "$('#progressInput')",
  'sideExportBtn.addEventListener',
  'sideClearBtn.addEventListener',
  'exportBtn.addEventListener',
  'function import',
  'JSON 파일',
  'CSV 불러오기 완료',
  'v8-core-b.js',
  'v8-mobile.js'
];
const result={generatedAt:new Date().toISOString(),terms:{}};
for(const term of terms){
  const hits=[];
  let index=html.indexOf(term);
  while(index>=0&&hits.length<12){
    hits.push({index,context:html.slice(Math.max(0,index-1200),Math.min(html.length,index+5000))});
    index=html.indexOf(term,index+term.length);
  }
  result.terms[term]=hits;
}
fs.mkdirSync(path.join(process.cwd(),'audit'),{recursive:true});
fs.writeFileSync(path.join(process.cwd(),'audit','core-snippets.json'),JSON.stringify(result,null,2));
