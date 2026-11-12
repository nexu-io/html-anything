function card(x,y,w,h,title,c='#ffffff'){saved(()=>{ctx.shadowColor='#0002';ctx.shadowBlur=18;rect(x,y,w,h,c,14)});text(title,x+20,y+27,18,c==='#ffffff'?'#222':'#fff','left','Arial',500,w-40)}
function chart(x,y,w,h,t,c=P.accent){line(x,y+h,x+w,y+h,'#999',1);for(let i=0;i<8;i++){let v=(.2+rand(i)*.6)*h*ease(t);rect(x+i*w/8,y+h-v,w/10,v,c,3)}}
function phone(x,y,w,h,t){rect(x,y,w,h,'#232323',27);rect(x+5,y+5,w-10,h-10,'#fcfcfa',23);rect(x+w*.38,y+12,w*.24,8,'#222',5);for(let i=0;i<3;i++){let yy=y+60+i*80-25*ease(t);card(x+16,yy,w-32,57,CONFIG.objects[i%CONFIG.objects.length],'#ffffff');rect(x+28,yy+40,(w-60)*ease(t+.2),3,P.accent,2)}}
function wires(x1,y1,x2,y2,c=P.accent){ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.bezierCurveTo((x1+x2)/2,y1,(x1+x2)/2,y2,x2,y2);ctx.stroke()}
function dots(x,y,n,c,t){for(let i=0;i<n;i++)ellipse(x+i*18,y,4,4,i/n<clamp(t)?c:'#cccccc')}
function drawScene(t){const u=stageProgress(t),n=stageAt(t),v=t/CONFIG.duration,b=CONFIG.palette[0],fg=CONFIG.palette[1];bg();fittedText(P.title,500,55,32,fg,900,'Arial',600);
let split= n<2?0:n<4?ease(u):1;const k=1-split*.3;for(let i=0;i<(split>.01?2:1);i++)at(500+(i?1:-1)*225*split,290,k,0,()=>{card(-290,-160,580,320,i?'New branch':'Original');for(let j=0;j<4;j++)rect(-250,-90+j*57,330-j*25,32,j===3&&i?P.accent+'77':'#eceee9',7)});if(split)wires(500,120,720,150,P.accent);;
text(CONFIG.stages[n].label,500,548,21,fg,'center','Arial',500,900);rect(50,581,900,3,fg+'22');rect(50,581,900*v,3,P.accent);}
