
function paper(x,y,w,h,title,color='#fff'){rect(x,y,w,h,color,12);text(title,x+18,y+24,18,(/^#[0-9a-f]{6}$/i.test(color)&&[1,3,5].reduce((v,j)=>v+parseInt(color.slice(j,j+2),16),0)<350)?'#fff':'#25262b','left','Arial',600,w-35);}
function rows(x,y,w,n=4,c='#b8bdc2',gap=22){for(let j=0;j<n;j++)rect(x,y+j*gap,w*(.64+rand(j)*.32),5,c,2)}
function ring(x,y,r,c,width=3){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke()}
function pill(x,y,w,txt,c='#fff',ink='#222'){rect(x-w/2,y-22,w,44,c,22);text(txt,x,y,18,ink,'center','Arial',500,w-26)}
function arrow(x,y,xx,yy,c){line(x,y,xx,yy,c,2);let a=Math.atan2(yy-y,xx-x);poly([[xx,yy],[xx-10*cos(a-.5),yy-10*sin(a-.5)],[xx-10*cos(a+.5),yy-10*sin(a+.5)]],c)}
function header(t,color=CONFIG.palette[1]){fittedText(P.title,500,55,30,color,870,'Arial',600)}
function foot(t,color=CONFIG.palette[1]){text(CONFIG.stages[stageAt(t)].label,500,557,16,color)}
function orbitNode(x,y,r,c,labelText){ellipse(x,y,r,r,c);text(labelText,x,y,16,'#25262b','center','Arial',500,r*1.65)}
function wave(x,y,w,h,c,t,phaseOffset=0){ctx.beginPath();for(let j=0;j<=80;j++){let xx=x+j*w/80,yy=y+sin(j*.15+t+phaseOffset)*h*(.4+.6*sin(j/80*Math.PI));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke()}
function drawScene(t){bg(t<1.6?'#000':'#070e65');let u=phase(t,2.8,3.8),x=mix(500,720,u),y=mix(300,420,u),s=mix(.75,1.2,u);at(x,y,s,t<3?t*.8:2.4,()=>{for(let j=0;j<3;j++)at(0,0,1,j*TAU/3,()=>{let g=ctx.createLinearGradient(-100,-100,120,100);g.addColorStop(0,t<1.6?'#267c45':'#eefcff');g.addColorStop(.35,P.accent);g.addColorStop(.7,'#111b35');g.addColorStop(1,'#abeaff');poly([[-40,-125],[40,-125],[80,-35],[45,-15],[5,-70],[-60,-70]],g,'#b1e2e8')})});if(t>3.1){text(P.title,85,130,64,'#fff','left','Arial',600,820);pill(135,200,100,'2.4T','#fff');pill(285,200,180,'Open Weight','#fff')}}
