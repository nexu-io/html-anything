
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){bg();saved(()=>{ctx.filter='blur(22px)';for(let i=0;i<8;i++){const y=70+i*90+sin(t*.3+i)*55;ctx.beginPath();ctx.moveTo(-100,y);ctx.bezierCurveTo(190,y-160*sin(t*.1+i),620,y+180*cos(t*.13+i),1100,y-40);ctx.lineWidth=80;ctx.strokeStyle=i%3===0?P.accent:CONFIG.palette[(i%3)+2];ctx.stroke()}});rect(0,0,1000,600,'#00000028');let names=P.title.split('×');fittedText(names[0].trim(),320,300,58,'#fff',340);line(500,255,500,345,'#ffffff88',1);fittedText((names[1]||'Partner').trim(),710,300,50,'#fff',350)}
