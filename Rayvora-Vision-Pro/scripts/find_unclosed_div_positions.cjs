const fs=require('fs');
const s=fs.readFileSync('src/components/AssessmentView.tsx','utf8');
const openRegex=/<\s*div\b[^>]*>/g;
const closeRegex=/<\s*\/\s*div\s*>/g;
let opens=[];let m;
while((m=openRegex.exec(s))!==null){opens.push({idx:m.index,match:m[0]});}
let closes=[];
while((m=closeRegex.exec(s))!==null){closes.push({idx:m.index,match:m[0]});}
// merge events
const events=[];opens.forEach(o=>events.push({idx:o.idx,type:'open',match:o.match}));closes.forEach(c=>events.push({idx:c.idx,type:'close',match:c.match}));
events.sort((a,b)=>a.idx-b.idx);
const stack=[];
for(const ev of events){
  if(ev.type==='open'){stack.push(ev);}else{
    if(stack.length>0){stack.pop();}else{console.log('Extra close at',ev.idx)}
  }
}
console.log('Unclosed opens count:', stack.length);
stack.forEach((sitem,i)=>{
  console.log('---',i+1,'pos',sitem.idx);
  const start=Math.max(0,sitem.idx-160);
  const end=Math.min(s.length,sitem.idx+160);
  console.log(s.slice(start,end));
});
