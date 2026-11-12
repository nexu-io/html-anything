
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){gradient(CONFIG.palette[0],CONFIG.palette[3]);let k=stageAt(t);if(k===0||k===7){fittedText(P.title,500,300,65,'#fff',900);return}text(P.title,500,55,32,'#fff');win(35,110,540,420,'Browser');win(600,110,365,420,'Terminal',true);lines(620,170,310,Math.min(17,4+Math.floor(stageProgress(t)*12)),true);if(k===3){for(let i=0;i<8;i++)for(let j=0;j<4;j++){ctx.strokeStyle='#b8c6d0';ctx.strokeRect(60+j*120,170+i*38,120,38);if(i)rect(70+j*120,185+i*38,70,5,i===3?P.accent:'#d2d8d6')}}else if(k===4){for(let i=0;i<5;i++){rect(70,170+i*62,455,43,'#edf0f2',7);ellipse(90,192+i*62,6,6,P.accent)}}else{lines(65,170,450,12);rect(65,440,450*stageProgress(t),5,P.accent)}cursor(120+stageProgress(t)*320,320);}
