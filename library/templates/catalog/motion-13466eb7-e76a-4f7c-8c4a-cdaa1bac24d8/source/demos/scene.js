
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
function drawScene(t){bg();header(t,'#fff');let n=stageAt(t),u=stageProgress(t);if(n<3){let count=n===0?1:n===1?5:12;for(let j=0;j<count;j++){let x=count===1?500:140+j%6*145,y=count<6?300:220+Math.floor(j/6)*180;ellipse(x,y-35,28,34,j%2?'#bbb':'#777');rect(x-38,y,76,95,j%2?'#888':'#555',18);if(n===2)rect(x-45,y-70,90,165,P.accent+'55',5)}pill(500,480,400,n===0?'ONE PERSON':n===1?'A TEAM OF AGENTS':'A REAL BUSINESS',P.accent)}else if(n===3){['HEALTH','FINANCIAL','SOFTWARE SERVICES','LIFESTYLE','ART CREATION'].forEach((v,j)=>{if(j===2)rect(180,140+j*75,640,60,P.accent);text(v,500,170+j*75,29,'#fff','center','monospace')})}else if(n<6){paper(260,130,480,380,'Agent3tm','#f1f0ee');rect(290,195,140,140,P.accent,6);text('4.8  ★',520,240,28,'#222');text('0.99 USDT',520,295,23,'#222');pill(500,440,340,'Use now',P.accent);cursor(650,450)}else{let names=['Open','Accepted','Submitted','Review','Completed'];names.forEach((v,j)=>{let x=130+j*185,active=u>j/5||n>6;ellipse(x,300,22,22,active?P.accent:'#444');text(v,x,360,18,'#fff');if(j<4)line(x+25,300,x+160,300,active?P.accent:'#444',3)});text(n>7?'NOW IT IS':'Settle in seconds',500,450,40,'#fff')} }
