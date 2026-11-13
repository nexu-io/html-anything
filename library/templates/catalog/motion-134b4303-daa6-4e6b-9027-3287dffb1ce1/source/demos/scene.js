
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){bg();let k=stageAt(t);if(k>=3){if(k===3){fittedText(P.title,500,400,48,ink(),800);face(500,240,85,'#171817',t)}else end();return}face(300,305,95,'#171817',0);const sx=Math.max(.018,Math.abs(cos((t-1)*1.8)));at(665,300,sx,.06,()=>{rect(-145,-90,290,180,P.accent,20);rect(-115,-58,38,30,'#dce8da',6);text('••••  ••••  ••••  4821',0,35,20,'#253b30','center','monospace');text(P.title,-115,64,15,'#253b30','left','Arial',400,230)});}
