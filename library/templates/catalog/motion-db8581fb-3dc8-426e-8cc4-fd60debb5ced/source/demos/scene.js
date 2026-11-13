
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function pixel(x,y,s){for(let j=0;j<5;j++)for(let i=0;i<5;i++)if(j>1||i===0||i===4)rect(x+i*s,y+j*s,s-1,s-1,[P.accent,'#f8aa16','#a82116'][j%3])}
function drawScene(t){bg();let k=stageAt(t),u=stageProgress(t);if(k===0||k===1||k===10){pixel(425,140,30);fittedText(P.title,500,400,68,ink(),850);return}if(k===4)bg('#171817');text(P.title,500,55,33,k===4?'#fff':ink());pixel(35,30,9);if(k===5||k===6){phone(350,100,300,450);ellipse(500,330,62,62,P.accent);for(let i=0;i<5;i++)rect(462+i*18,330-(10+sin(t*4+i)*15)/2,8,Math.abs(10+sin(t*4+i)*15),'#fff',4)}else if(k===9){win(100,140,360,335,'Before');win(540,140,360,335,'After');person(280,330,1.6,'#718c76');person(720,330,1.6,P.accent)}else{win(160,130,680,370,'Project');lines(200,185,580,10);rect(200,425,580*u,8,P.accent)}}
