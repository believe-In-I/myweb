const fs = require('fs');
const path = require('path');

const inFile = process.argv[2] || 'deps.json';
const outFile = process.argv[3] || 'deps.dot';

if(!fs.existsSync(inFile)){
  console.error('Input file not found:', inFile);
  process.exit(1);
}

let content = fs.readFileSync(inFile, 'utf8');
// 移除 BOM 字符
if(content.charCodeAt(0) === 0xFEFF){
  content = content.slice(1);
}
const data = JSON.parse(content);

const nodes = new Map();
const edges = new Set();

function safe(s){
  return String(s).replace(/["\\/\s:@<>\[\]\(\)\\`\$\^\{\}\|,#\.]/g,'_');
}

function nodeId(name, version){
  return `${name}@${version}`;
}

function addNode(name, version){
  const id = nodeId(name, version || '');
  const sid = safe(id);
  nodes.set(sid, { id: sid, label: `${name}\\n${version || ''}` });
  return sid;
}

function traverse(node, parentSid){
  const name = node.name || '(root)';
  const ver = node.version || '';
  const sid = addNode(name, ver);
  if(parentSid){
    edges.add(`"${parentSid}" -> "${sid}";`);
  }
  const deps = node.dependencies || {};
  for(const k of Object.keys(deps)){
    traverse(deps[k], sid);
  }
}

traverse(data, null);

const lines = [
  'digraph dependencies {',
  '  node [shape=box, style=rounded];'
];
for(const n of nodes.values()){
  lines.push(`  "${n.id}" [label="${n.label}"];`);
}
for(const e of edges){
  lines.push(`  ${e}`);
}
lines.push('}');

fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
console.log('Wrote', outFile);
