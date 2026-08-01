const fs = require('fs');
const p = 'src/components/AssessmentView.tsx';
const s = fs.readFileSync(p, 'utf8');
const counts = {
  '{': (s.match(/\{/g) || []).length,
  '}': (s.match(/\}/g) || []).length,
  '(': (s.match(/\(/g) || []).length,
  ')': (s.match(/\)/g) || []).length,
  '<': (s.match(/</g) || []).length,
  '>': (s.match(/>/g) || []).length,
};
console.log('file:', p);
console.log(counts);
