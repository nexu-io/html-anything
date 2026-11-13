
function paper(x,y,w,h,title,color='#fff'){rect(x,y,w,h,color,12);text(title,x+18,y+24,18,(/^#[0-9a-f]{6}$/i.test(color)&&[1,3,5].reduce((v,j)=>v+parseInt(color.slice(j,j+2),16),0)<350)?'#fff':'#25262b','left','Arial',600,w-35);}
function rows(x,y,w,n=4,c='#b8bdc2',gap=22){for(let j=0;j<n;j++)rect(x,y+j*gap,w*(.64+rand(j)*.32),5,c,2)}
function ring(x,y,r,c,width=3){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke()}
function pill(x,y,w,txt,c='#fff',ink='#222'){rect(x-w/2,y-22,w,44,c,22);text(txt,x,y,18,ink,'center','Arial',500,w-26)}
function arrow(x,y,xx,yy,c){line(x,y,xx,yy,c,2);let a=Math.atan2(yy-y,xx-x);poly([[xx,yy],[xx-10*cos(a-.5),yy-10*sin(a-.5)],[xx-10*cos(a+.5),yy-10*sin(a+.5)]],c)}
function header(t,color=CONFIG.palette[1]){fittedText(P.title,500,55,30,color,870,'Arial',600)}
function foot(t,color=CONFIG.palette[1]){text(CONFIG.stages[stageAt(t)].label,500,557,16,color)}
function orbitNode(x,y,r,c,labelText){ellipse(x,y,r,r,c);text(labelText,x,y,16,'#25262b','center','Arial',500,r*1.65)}
function wave(x,y,w,h,c,t,phaseOffset=0){ctx.beginPath();for(let j=0;j<=80;j++){let xx=x+j*w/80,yy=y+sin(j*.15+t+phaseOffset)*h*(.4+.6*sin(j/80*Math.PI));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke()}

function sphere(x,y,r,c='#3c2de7',t=0){let g=ctx.createRadialGradient(x-r*.4,y-r*.5,r*.02,x,y,r);g.addColorStop(0,'#efffff');g.addColorStop(.2,c);g.addColorStop(.75,'#2921b8');g.addColorStop(1,'#0a123a');ellipse(x,y,r,r,g)}
function ccPath(){ctx.beginPath();ctx.moveTo(-25,-35);ctx.bezierCurveTo(-150,-165,-265,0,-150,85);ctx.bezierCurveTo(-35,185,25,45,-20,10);ctx.lineTo(-88,-45);ctx.bezierCurveTo(-115,-65,-143,-18,-110,5);ctx.lineTo(-25,75);ctx.bezierCurveTo(125,190,245,65,190,-65);ctx.bezierCurveTo(150,-150,55,-150,10,-100)}
function cc(c,width=34){ccPath();ctx.strokeStyle=c;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}

function w2Lines(s,x,y,size,c,align='center',gap=24){String(s).split('\n').forEach((v,j)=>text(v,x,y+j*gap,size,c,align,'Arial',400));}
function drawScene(t){let n=stageAt(t),u=stageProgress(t);bg(n>=6&&n<9?P.accent:'#efeee9');if(n<4||n===9){let count=n===9?30:9;for(let j=0;j<count;j++){let a=j*TAU/count+t*.025,r=180+(j%3)*25,x=500+cos(a)*r,y=300+sin(a)*r*.75;line(500,300,x,y,'#444',1);ellipse(x,y,12+j%3*4,12+j%3*4,CONFIG.palette[2+j%4])}ellipse(500,300,35,35,n===3?P.accent:'#111')}else if(n===4){for(let j=0;j<12;j++){let x=100+frac(j/12+u*.4)*800;ellipse(x,300,15,15,j%4===0?P.accent:'#111')}arrow(150,390,850,390,'#111')}else if(n===5){let count=Math.floor(1+u*220);for(let j=0;j<count;j++)ellipse(200+j%25*25,190+Math.floor(j/25)*25,5,5,'#111')}else if(n===6){ellipse(500,300,180+sin(u*Math.PI)*100,180+sin(u*Math.PI)*100,'#111');text('No clicking',500,300,42,'#fff')}else if(n===7){ring(500,300,190,'#fff',2);for(let j=-3;j<=3;j++){ctx.beginPath();ctx.ellipse(500,300,Math.abs(j)*53+15,190,0,0,TAU);ctx.strokeStyle='#fff';ctx.stroke();line(320,300+j*45,680,300+j*45,'#fff')}}else if(n===8){for(let j=-7;j<=7;j++){let y=j*22,w=Math.sqrt(Math.max(0,190*190-y*y));line(500-w,300+y,500+w,300+y,'#fff',8)}}else{text(P.title,500,300,50,'#111','center','monospace');}if(n<10)text(useTitle(CONFIG.stages[n].label),500,540,24,n>=6&&n<9?'#fff':'#111','center','monospace')}
