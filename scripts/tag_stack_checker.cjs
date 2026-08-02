const fs=require('fs');
const s=fs.readFileSync('src/components/AssessmentView.tsx','utf8');
const regex=/<\s*(\/)?\s*([a-zA-Z0-9_-]+)([^>]*)>/g;
let m;const stack=[];const selfClosingTags=['img','input','br','hr','polyline','line'];
while((m=regex.exec(s))!==null){
  const isClose=!!m[1];
  const tag=m[2];
  const attrs=m[3]||'';
  const full=m[0];
  const idx=m.index;
  const selfClosing = /\/$/.test(attrs) || selfClosingTags.includes(tag);
  if(!isClose && !selfClosing){
    stack.push({tag, idx, snippet: s.slice(Math.max(0,idx-80), Math.min(s.length, idx+80))});
  } else if(isClose){
    // pop last matching
    for(let i=stack.length-1;i>=0;i--){
      if(stack[i].tag===tag){stack.splice(i,1);break}
    }
  }
}
console.log('Unclosed tags count:', stack.length);
stack.slice(0,40).forEach((t,i)=>{
  console.log('---',i+1,t.tag,'at',t.idx);
  console.log(t.snippet);
});
