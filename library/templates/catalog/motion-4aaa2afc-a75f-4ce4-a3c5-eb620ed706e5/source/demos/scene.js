
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
function drawScene(t){bg();header(t);let n=stageAt(t),u=stageProgress(t);if(n<3){for(let j=0;j<6;j++){let x=210+j%3*285,y=210+Math.floor(j/3)*190;paper(x-80,y-45,200,130,['Objectives','Customers','Strategy','Delivery','Team','Product'][j],CONFIG.palette[2+j%4]);cursor(x+70+sin(t+j)*25,y+70,'#333')}}else if(n<6){paper(120,120,760,380,'HiveHaus · Product goals');for(let j=0;j<5;j++){text(['Improve activation','Research needs','Prototype','Test with users','Ship changes'][j],155,210+j*55,19,'#333','left');rect(390+j*38,192+j*55,130+u*80,28,CONFIG.palette[2+j%4],5)}cursor(690,350+sin(t)*60)}else if(n<9){paper(125,150,380,320,n===7?'Customer insights':'Design brief');rows(150,210,310,7);let k=phase(t,94,101);rect(610,120,220,390,'#222',28);rect(623,135,194,360,'#fff',18);text('Thermostat',720,190,22,'#222');ellipse(720,300,60,60,P.accent);text(Math.round(20+u*3)+'°',720,300,36,'#222');pill(720,430,140,k>.6?'Saved':'Set temperature','#b7dfea')}else{paper(90,130,360,370,'Product brief');rows(115,195,290,10);for(let j=0;j<4;j++){let x=580+j%2*220,y=220+Math.floor(j/2)*150;paper(x-60,y-30,150,85,['User','Device','Setting','Event'][j]);if(j>0)line(580,220,x,y,P.accent,3)}if(n>9){rect(510,420,410,70,'#222',8);text('Implement product flow',535,450,19,'#f4f4f4','left')}}foot(t)}
