
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
function drawScene(t){bg();let n=stageAt(t);text(progressText(P.title==='The web is humanity’s living memory'?P.title:P.title,phase(t,1.7,3.2)),500,260,35,'#171717','center','Georgia',400,850);if(t<3.2)rect(500+(t>1.8?210:-5),240,3,35,P.accent);if(t>3.25){let count=Math.min(18,Math.floor((t-3.25)*8)+1);for(let j=0;j<count;j++){let x=90+rand(j+8)*650,y=70+rand(j+20)*330,w=190+rand(j)*180,h=160+rand(j+1)*140;at(x,y,1,(j%3-1)*.025,()=>{rect(0,0,w,h,j<6?'#e9e2cf':'#d0d2d0',1);if(j<6){for(let k=0;k<9;k++){let a=k*TAU/9;line(w/2,h/2,w/2+cos(a)*60,h/2+sin(a)*55,'#6c6657',1);ring(w/2+cos(a)*30,h/2+sin(a)*30,12,'#6c6657',1)}text(['Natural history','Astronomy','Studies'][j%3],w/2,h-22,17,'#292820','center','Georgia')}else{rect(4,4,w-8,23,j%2?P.accent:'#777e89');text(['World Wide Web','Knowledge archive','Search the web'][j%3],14,15,12,'#fff','left');rect(7,34,w-14,h-41,'#fff');text(j%3?'Welcome to the web':'Search',w/2,65,22,'#222','center','Times New Roman');for(let k=0;k<4;k++)text(['About this project','Browse information','Related resources','More links'][k],15,105+k*22,13,P.accent,'left','Times New Roman')}})}}}
