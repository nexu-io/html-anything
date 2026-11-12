
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){bg();glow(800,300,500,P.accent);let k=stageAt(t);text(P.title,70,170,34,'#fff','left','Arial',500,360);const labels=['Project memory','Save while you work','Inspect MEMORY.md','Read in a new session','Keep project context'];text(labels[k],70,235,23,'#bbcece','left','Arial',400,360);win(470,90,470,420,'~/project · '+(k>=3?'new session':'session A'),true);text('MEMORY.md',490,150,20,P.accent,'left','monospace');const list=['# Project context','- Prefer small, editable components','- Brand accent: '+P.accent,'- Export reviewed versions only','> Read saved project context'];list.slice(0,Math.min(5,2+k)).forEach((s,i)=>text(progressText(s,clamp(stageProgress(t)*2+i*.3)),490,198+i*50,16,'#d8e2dc','left','monospace',430))}
