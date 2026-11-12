
function paper(x,y,w,h,title,color='#fff'){rect(x,y,w,h,color,12);text(title,x+18,y+24,18,(/^#[0-9a-f]{6}$/i.test(color)&&[1,3,5].reduce((v,j)=>v+parseInt(color.slice(j,j+2),16),0)<350)?'#fff':'#25262b','left','Arial',600,w-35);}
function rows(x,y,w,n=4,c='#b8bdc2',gap=22){for(let j=0;j<n;j++)rect(x,y+j*gap,w*(.64+rand(j)*.32),5,c,2)}
function ring(x,y,r,c,width=3){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke()}
function pill(x,y,w,txt,c='#fff',ink='#222'){rect(x-w/2,y-22,w,44,c,22);text(txt,x,y,18,ink,'center','Arial',500,w-26)}
function arrow(x,y,xx,yy,c){line(x,y,xx,yy,c,2);let a=Math.atan2(yy-y,xx-x);poly([[xx,yy],[xx-10*cos(a-.5),yy-10*sin(a-.5)],[xx-10*cos(a+.5),yy-10*sin(a+.5)]],c)}
function header(t,color=CONFIG.palette[1]){fittedText(P.title,500,55,30,color,870,'Arial',600)}
function foot(t,color=CONFIG.palette[1]){text(CONFIG.stages[stageAt(t)].label,500,557,16,color)}
function orbitNode(x,y,r,c,labelText){ellipse(x,y,r,r,c);text(labelText,x,y,16,'#25262b','center','Arial',500,r*1.65)}
function wave(x,y,w,h,c,t,phaseOffset=0){ctx.beginPath();for(let j=0;j<=80;j++){let xx=x+j*w/80,yy=y+sin(j*.15+t+phaseOffset)*h*(.4+.6*sin(j/80*Math.PI));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke()}
function drawScene(t){bg();header(t);let n=stageAt(t),u=stageProgress(t);if(n<2){at(500,305,1,0,()=>{rect(-65,-110,130,220,'#171917',7);rect(10,-75,25,25,'#b9bcb2',4);text(P.title,-45,80,20,'#fff','left');});if(n===1)for(let j=0;j<4;j++){let a=j*TAU/4,rr=170*ease(u);paper(430+cos(a)*rr,260+sin(a)*rr,140,100,'Invoice');rows(442+cos(a)*rr,297+sin(a)*rr,100,3)}}else if(n<4){paper(310,145,380,340,n===2?'Upload invoice':'Invoice details');rows(345,220,280,6);let x=mix(810,510,ease(u));pill(x,390,160,'invoice.pdf',P.accent);cursor(x+55,415)}else{ui(130,140,730,350,P.accent,n===4?'Reporting':n===5?'Bills':'Forecast');rect(310,230,370,180,'#fff');for(let j=0;j<4;j++)wave(325,300+j*20,330,25,['#9db9e3','#e6bdb6','#9dbd9f','#cfbcde'][j],u*.3,j);paper(700,210,190,290,'Bills');rows(720,260,140,8);rect(85,410,170,105,'#171917',6);text(P.title,115,440,20,'#fff','left')}foot(t)}
