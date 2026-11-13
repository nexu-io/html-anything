
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){bg();let k=stageAt(t);text(P.title,500,44,32,'#ddd');win(25,95,k<4?950:440,465,'Prompt / reasoning / code',true);lines(55,155,k<4?860:380,Math.min(21,5+Math.floor(stageProgress(t)*17)),true);if(k>=4){for(let j=0;j<3;j++)for(let i=0;i<3;i++){let cx=560+i*165,cy=180+j*150,n=3+j*3+i,r=62+sin(t)*5;poly(Array.from({length:n},(_,p)=>[cx+cos(p*TAU/n+t*.15)*r,cy+sin(p*TAU/n+t*.15)*r]),null,'#aab6b0');for(let z=0;z<3;z++){let a=t*(.4+z*.2)+i+j,r2=r*.3;ellipse(cx+sin(a*2)*r2,cy+cos(a*3)*r2,6,6,z===0?P.accent:CONFIG.palette[z+2])}}}}
