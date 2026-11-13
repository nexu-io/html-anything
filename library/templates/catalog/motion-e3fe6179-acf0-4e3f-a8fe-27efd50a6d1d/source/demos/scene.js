
function paper(x,y,w,h,title,color='#fff'){rect(x,y,w,h,color,12);text(title,x+18,y+24,18,(/^#[0-9a-f]{6}$/i.test(color)&&[1,3,5].reduce((v,j)=>v+parseInt(color.slice(j,j+2),16),0)<350)?'#fff':'#25262b','left','Arial',600,w-35);}
function rows(x,y,w,n=4,c='#b8bdc2',gap=22){for(let j=0;j<n;j++)rect(x,y+j*gap,w*(.64+rand(j)*.32),5,c,2)}
function ring(x,y,r,c,width=3){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke()}
function pill(x,y,w,txt,c='#fff',ink='#222'){rect(x-w/2,y-22,w,44,c,22);text(txt,x,y,18,ink,'center','Arial',500,w-26)}
function arrow(x,y,xx,yy,c){line(x,y,xx,yy,c,2);let a=Math.atan2(yy-y,xx-x);poly([[xx,yy],[xx-10*cos(a-.5),yy-10*sin(a-.5)],[xx-10*cos(a+.5),yy-10*sin(a+.5)]],c)}
function header(t,color=CONFIG.palette[1]){fittedText(P.title,500,55,30,color,870,'Arial',600)}
function foot(t,color=CONFIG.palette[1]){text(CONFIG.stages[stageAt(t)].label,500,557,16,color)}
function orbitNode(x,y,r,c,labelText){ellipse(x,y,r,r,c);text(labelText,x,y,16,'#25262b','center','Arial',500,r*1.65)}
function wave(x,y,w,h,c,t,phaseOffset=0){ctx.beginPath();for(let j=0;j<=80;j++){let xx=x+j*w/80,yy=y+sin(j*.15+t+phaseOffset)*h*(.4+.6*sin(j/80*Math.PI));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke()}
function drawScene(t){let n=stageAt(t);bg(n===0?'#fbdc20':n===1?'#fbdc20':n===2?'#f5aab7':P.accent);if(n<2){for(let j=-1;j<6;j++){let x=j*240+sin(t*2)*30;poly(n===0?[[x,-50],[x+100,-50],[x+260,300+sin(t*2)*130],[x+150,650],[x+50,650],[x+140,300+sin(t*2)*130]]:[[x,-50],[x+155,-50],[x+155,270],[x+70,310],[x+120,650],[x,650],[x-40,270]],n===0?P.accent:'#ee477a')}}else if(n===2){for(let k=0;k<2;k++){ctx.beginPath();ctx.moveTo(k?1000:0,0);for(let y=0;y<=600;y+=5)ctx.lineTo((k?740:260)+sin(y*.035+t*2)*45,y);ctx.lineTo(k?1000:0,600);ctx.fillStyle='#ee477a';ctx.fill()}}else{for(let j=0;j<9;j++)ellipse((j%3)*420+sin(t+j)*75,((j*163+t*55)%850)-100,45+(j%4)*38,45+(j%4)*38,'#060526')}if(P.title!==CONFIG.demoTitle)text(P.title,500,300,42,'#fff')}
