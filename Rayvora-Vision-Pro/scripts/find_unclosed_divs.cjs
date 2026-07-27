const fs=require('fs');
const s=fs.readFileSync('src/components/AssessmentView.tsx','utf8');
const regex=/<\s*\/?\s*([a-zA-Z0-9_-]+)\b/g;
let m;let stack=[];let index=0;const positions=[];
while((m=regex.exec(s))!==null){
  const tag=m[1];
  const isClose=s[m.index+1]==='/';
  if(tag==='div'){
    positions.push({pos:m.index,isClose});
  }
}
let count=0;for(const p of positions){
  if(!p.isClose){count++;}else{count--;}
  if(count<0){console.log('Extra closing div at',p.pos);count=0}
}
console.log('Remaining open divs:', count);
// print last 200 chars around last occurrence of open div
const lastOpenPos = positions.filter(p=>!p.isClose).slice(-10).map(p=>p.pos);
if(lastOpenPos.length){
  const pos=lastOpenPos[lastOpenPos.length-1];
  console.log('\nContext around last open <div> at',pos, '\n');
  console.log(s.slice(Math.max(0,pos-120),pos+120));
}

// print contexts for last few closing divs
const lastClosePos = positions.filter(p=>p.isClose).slice(-10).map(p=>p.pos);
if(lastClosePos.length){
  const pos=lastClosePos[lastClosePos.length-1];
  console.log('\nContext around last close </div> at',pos,'\n');
  console.log(s.slice(Math.max(0,pos-120),pos+120));
}
