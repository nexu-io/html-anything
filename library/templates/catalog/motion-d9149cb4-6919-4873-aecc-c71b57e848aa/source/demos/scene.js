
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
function drawScene(t){bg();let n=stageAt(t),u=stageProgress(t),variant=3;at(500,300,.85+.025*sin(t*4),.025*sin(t*3),()=>{let g=ctx.createLinearGradient(-200,-150,200,150);g.addColorStop(0,P.accent);g.addColorStop(.45,CONFIG.palette[3]);g.addColorStop(1,CONFIG.palette[4]);if(n%3===0){for(let j=0;j<8;j++){let x=-230+j*65,y=(j%2?-125:100);rect(x,y,50,60,CONFIG.palette[2+j%(CONFIG.palette.length-2)]);line(x,y-40,x,y+100,'#9996');}cc(g,40)}else if(n%3===1){for(let j=0;j<12;j++){let a=j*TAU/12+t*.3;flower(cos(a)*220,sin(a)*145,15+j%3*8,CONFIG.palette[2+j%(CONFIG.palette.length-2)],a)}cc(g,40)}else{for(let j=0;j<4;j++){cc(g,48-j*10)}for(let j=0;j<5;j++)sphere(cos(j*1.6+t)*230,sin(j*1.6+t)*160,18,CONFIG.palette[2+j%(CONFIG.palette.length-2)])}if(variant===1){for(let j=0;j<22;j++)ellipse(cos(j*.7)*150,sin(j*.7)*100,4,4,'#294528')}if(variant===4)for(let j=0;j<6;j++)star(cos(j*1.3)*220,sin(j*1.3)*160,20,P.accent,5,t);});if(P.title!==CONFIG.demoTitle)text(P.title,500,550,24,'#222');}
