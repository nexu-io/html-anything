
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
function drawScene(t){let n=stageAt(t),u=stageProgress(t);bg(n===1||n===4?'#245be8':'#f6f6f3');if(n===0||n>4){text(useTitle(n===0?'Exa is now in Codex':n===5?'Search the web in Codex':'exa'),500,300,56,n===5?P.accent:'#18191b','center','Arial',600,850)}else if(n===1){paper(120,170,760,260,'New task');pill(245,235,170,'Exa search',P.accent,'#fff');w2Lines(progressText('Find companies that redesigned\nan API from developer feedback.\nShow what changed.',phase(u,0,.85)),170,315,23,'#222','left',34);cursor(830,380)}else if(n<4){paper(120,130,760,360,'Search activity',n===3?'#141821':'#fff');for(let j=0;j<6;j++){text((j%2?'↳ ':'✓ ')+['Web search','Retrieve sources','Compare evidence'][j%3],155,210+j*42,20,n===3?'#c5d2e4':'#333','left','monospace');rect(680,195+j*42,130,7,P.accent)}}else{paper(100,100,800,420,'Research summary');['Company','Feedback signal','What changed'].forEach((v,j)=>text(v,140+j*250,185,20,'#222','left'));for(let j=0;j<5;j++){line(130,220+j*52,870,220+j*52,'#ddd');for(let k=0;k<3;k++)rows(140+k*250,245+j*52,180,1,k===0?P.accent:'#999')}}}
