
function paper(x,y,w,h,title,color='#fff'){rect(x,y,w,h,color,12);text(title,x+18,y+24,18,(/^#[0-9a-f]{6}$/i.test(color)&&[1,3,5].reduce((v,j)=>v+parseInt(color.slice(j,j+2),16),0)<350)?'#fff':'#25262b','left','Arial',600,w-35);}
function rows(x,y,w,n=4,c='#b8bdc2',gap=22){for(let j=0;j<n;j++)rect(x,y+j*gap,w*(.64+rand(j)*.32),5,c,2)}
function ring(x,y,r,c,width=3){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke()}
function pill(x,y,w,txt,c='#fff',ink='#222'){rect(x-w/2,y-22,w,44,c,22);text(txt,x,y,18,ink,'center','Arial',500,w-26)}
function arrow(x,y,xx,yy,c){line(x,y,xx,yy,c,2);let a=Math.atan2(yy-y,xx-x);poly([[xx,yy],[xx-10*cos(a-.5),yy-10*sin(a-.5)],[xx-10*cos(a+.5),yy-10*sin(a+.5)]],c)}
function header(t,color=CONFIG.palette[1]){fittedText(P.title,500,55,30,color,870,'Arial',600)}
function foot(t,color=CONFIG.palette[1]){text(CONFIG.stages[stageAt(t)].label,500,557,16,color)}
function orbitNode(x,y,r,c,labelText){ellipse(x,y,r,r,c);text(labelText,x,y,16,'#25262b','center','Arial',500,r*1.65)}
function wave(x,y,w,h,c,t,phaseOffset=0){ctx.beginPath();for(let j=0;j<=80;j++){let xx=x+j*w/80,yy=y+sin(j*.15+t+phaseOffset)*h*(.4+.6*sin(j/80*Math.PI));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke()}
function drawScene(t){bg();header(t);let n=stageAt(t),u=stageProgress(t);if(n===5||n===6){gradient('#f3b59d','#8171dc');let count=n===5?Math.ceil(u*3):3;for(let j=0;j<count;j++){paper(330,110+j*140,340,100,['Trigger','Search messages','Summarize'][j]);rows(352,153+j*140,270,2);if(j>0)arrow(500,210+(j-1)*140,500,240+(j-1)*140,'#fff')} }else if(n===4||n===8){for(let j=0;j<5;j++)rect(230-j*8,240-j*8,540+j*16,120+j*16,'#aba3db22',10);paper(230,240,540,120,'Prepare me for my day');rows(255,305,450,2);cursor(730,335)}else{let count=n<2?5:8;for(let j=0;j<count;j++){let a=j*TAU/count+t*.03,x=500+cos(a)*315,y=310+sin(a)*185;line(500,310,x,y,'#c0bada');if(n<2){ellipse(x,y,24,24,j%2?P.accent:'#dbff59')}else{paper(x-80,y-34,160,68,['Daily catch-up','Analyze deals','Run checks','Meeting prep'][j%4]);}}ellipse(500,310,55,55,P.accent);text(n>6?'Knowledge':'Agents',500,310,20,'#fff')}foot(t)}
