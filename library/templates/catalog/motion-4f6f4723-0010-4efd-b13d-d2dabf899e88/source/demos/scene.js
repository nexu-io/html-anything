function card(x,y,w,h,title,c='#ffffff'){saved(()=>{ctx.shadowColor='#0002';ctx.shadowBlur=18;rect(x,y,w,h,c,14)});text(title,x+20,y+27,18,c==='#ffffff'?'#222':'#fff','left','Arial',500,w-40)}
function chart(x,y,w,h,t,c=P.accent){line(x,y+h,x+w,y+h,'#999',1);for(let i=0;i<8;i++){let v=(.2+rand(i)*.6)*h*ease(t);rect(x+i*w/8,y+h-v,w/10,v,c,3)}}
function phone(x,y,w,h,t){rect(x,y,w,h,'#232323',27);rect(x+5,y+5,w-10,h-10,'#fcfcfa',23);rect(x+w*.38,y+12,w*.24,8,'#222',5);for(let i=0;i<3;i++){let yy=y+60+i*80-25*ease(t);card(x+16,yy,w-32,57,CONFIG.objects[i%CONFIG.objects.length],'#ffffff');rect(x+28,yy+40,(w-60)*ease(t+.2),3,P.accent,2)}}
function wires(x1,y1,x2,y2,c=P.accent){ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.bezierCurveTo((x1+x2)/2,y1,(x1+x2)/2,y2,x2,y2);ctx.stroke()}
function dots(x,y,n,c,t){for(let i=0;i<n;i++)ellipse(x+i*18,y,4,4,i/n<clamp(t)?c:'#cccccc')}
function drawScene(t){const u=stageProgress(t),n=stageAt(t),v=t/CONFIG.duration,b=CONFIG.palette[0],fg=CONFIG.palette[1];bg();fittedText(P.title,500,55,32,fg,900,'Arial',600);
if(n<3){ui(100,120,800,370,P.accent,'Create slides',ease(u))}else{for(let i=2;i>=0;i--)at(500+i*120-u*60,310,1-i*.15,(i-1)*.045,()=>{card(-280,-150,560,300,CONFIG.stages[(n+i)%CONFIG.stages.length].label);chart(-230,-50,440,150,ease(u+.5),CONFIG.palette[2+i%3])})};
text(CONFIG.stages[n].label,500,548,21,fg,'center','Arial',500,900);rect(50,581,900,3,fg+'22');rect(50,581,900*v,3,P.accent);}
