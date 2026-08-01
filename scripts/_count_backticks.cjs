const fs = require('fs');
const p = 'src/components/AssessmentView.tsx';
const s = fs.readFileSync(p, 'utf8');
const count = (s.match(/`/g) || []).length;
console.log('file:', p);
console.log('length:', s.length);
console.log('backticks count:', count);
console.log('first backtick index:', s.indexOf('`'));
console.log('last backtick index:', s.lastIndexOf('`'));

// print surrounding context for first unmatched if odd
if (count % 2 === 1) {
  console.log('Unbalanced backticks!');
  const idx = s.indexOf('`');
  const snippet = s.slice(Math.max(0, idx-120), Math.min(s.length, idx+120));
  console.log('context around first backtick:\n', snippet);
}
