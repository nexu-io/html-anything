
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){bg();let k=stageAt(t);if(k===8){end();return}if(k===0){win(250,100,500,370,'COMPUTER',true);lines(280,170,420,12,true);rect(220,480,560,40,'#adb4a9',10)}else{const r=120+sin(t)*15;for(let i=0;i<16;i++){const a=i*TAU/16+t*.2;ellipse(500+cos(a)*r,300+sin(a)*r,r*.2,r*.6,CONFIG.palette[(i%3)+2]);}ellipse(500,300,110,110,k===7?'#36596b':'#dae0d6');for(let i=0;i<12;i++){let y=70+i*41;rect(rand(i+Math.floor(t*8))*650,y,200+rand(i)*250,2+i%3,P.accent);text('0101  vec2  WORLD('+i+')',rand(i)*450,y+10,12,'#203b2f','left','monospace')}}text(P.title,500,555,24,ink())}
