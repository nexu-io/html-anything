function card(x,y,w,h,title,c='#ffffff'){saved(()=>{ctx.shadowColor='#0002';ctx.shadowBlur=18;rect(x,y,w,h,c,14)});text(title,x+20,y+27,18,c==='#ffffff'?'#222':'#fff','left','Arial',500,w-40)}
function chart(x,y,w,h,t,c=P.accent){line(x,y+h,x+w,y+h,'#999',1);for(let i=0;i<8;i++){let v=(.2+rand(i)*.6)*h*ease(t);rect(x+i*w/8,y+h-v,w/10,v,c,3)}}
function phone(x,y,w,h,t){rect(x,y,w,h,'#232323',27);rect(x+5,y+5,w-10,h-10,'#fcfcfa',23);rect(x+w*.38,y+12,w*.24,8,'#222',5);for(let i=0;i<3;i++){let yy=y+60+i*80-25*ease(t);card(x+16,yy,w-32,57,CONFIG.objects[i%CONFIG.objects.length],'#ffffff');rect(x+28,yy+40,(w-60)*ease(t+.2),3,P.accent,2)}}
function wires(x1,y1,x2,y2,c=P.accent){ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.bezierCurveTo((x1+x2)/2,y1,(x1+x2)/2,y2,x2,y2);ctx.stroke()}
function dots(x,y,n,c,t){for(let i=0;i<n;i++)ellipse(x+i*18,y,4,4,i/n<clamp(t)?c:'#cccccc')}
function drawScene(t){const u=stageProgress(t),n=stageAt(t),v=t/CONFIG.duration,b=CONFIG.palette[0],fg=CONFIG.palette[1];bg();fittedText(P.title,500,55,32,fg,900,'Arial',600);
for(let i=0;i<6;i++){let x=110+i%3*270,y=145+Math.floor(i/3)*160;card(x,y,245,135,'Skill '+(i+1));rect(x+175,y+20,48,25,i<=n?P.accent:'#aaa',13);ellipse(x+188+(i<=n?22:0),y+32,9,9,'#fff');dots(x+20,y+85,8,P.accent,u)}if(n>2&&n<7){rect(0,95,1000,430,'#0003');card(300,175,400,260,CONFIG.stages[n].label);rect(345,250,310,100,'#f1f3f6',8);cursor(520,310)};
text(CONFIG.stages[n].label,500,548,21,fg,'center','Arial',500,900);rect(50,581,900,3,fg+'22');rect(50,581,900*v,3,P.accent);}
