const fs = require('fs');
const s = fs.readFileSync('D:/workspace/TaskManager/index.html', 'utf8');
const m = s.match(/<script>([\s\S]*?)<\/script>/g);
let code = '';
if (m) {
  m.forEach(b => { code += b.replace(/<\/?script>/g, '') + '\n'; });
}
try {
  new Function(code);
  console.log('SYNTAX_OK');
} catch (e) {
  console.error('SYNTAX_ERROR:', e.message);
  process.exit(1);
}
