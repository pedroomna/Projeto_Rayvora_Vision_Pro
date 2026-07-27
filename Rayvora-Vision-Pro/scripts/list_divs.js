const fs=require('fs');
const s=fs.readFileSync('src/components/AssessmentView.tsx','utf8');
const lines=s.split(/\r?\n/);
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('<div')){
    console.log((i+1)+': '+lines[i].trim());
  }
}
console.log('Total lines',lines.length);
