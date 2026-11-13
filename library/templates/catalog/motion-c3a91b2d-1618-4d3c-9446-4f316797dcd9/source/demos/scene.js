
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
function drawScene(t){bg();let n=stageAt(t),u=stageProgress(t);text(P.title,500,55,30,'#352a20','center','Georgia');if(n<2){text('What would you like to work on?',500,210,37,'#352a20','center','Georgia');paper(200,280,600,160,'Run a model health check.','#faf7f0');pill(350,385,220,'model/checkpoint','#d7cbb5')}else if(n===2||n===7){for(let j=15;j>=0;j--){at(500,220+j*9,1,.18,()=>rect(-140,-32,280,n===7?40+sin(j*.4+u*3)*18:40,j%2?P.accent:'#c8b193',3))}text(n===7?'Rank structure':'Model · 32 layers',500,460,26,'#352a20','center','Georgia')}else if(n===3){paper(230,175,540,240,'Evaluation dataset','#faf7f0');rows(260,250,450,4,'#bcb09b');pill(500,380,190,u>.5?'Confirmed':'Use this dataset',P.accent,'#fff');cursor(560,395)}else{paper(150,120,700,380,n>7?'Next experiment':'Planned checks','#faf7f0');for(let j=0;j<7;j++){let done=n>6||n===6&&u>j/7;text(done?'✓':'○',185,195+j*39,20,done?'#7c9278':'#94714c');text(['Activation health','Rank analysis','Feature sparsity','Dataset shift','Layer stability','Output behavior','Intervention scan'][j],225,195+j*39,19,'#352a20','left','Georgia');rect(620,185+j*39,160*(n<6?.05:clamp(u*2-j*.15)),8,P.accent,4)}if(n===4||n===5)pill(720,470,150,u>.3&&n===5?'Running':'Launch',P.accent,'#fff')}foot(t)}
