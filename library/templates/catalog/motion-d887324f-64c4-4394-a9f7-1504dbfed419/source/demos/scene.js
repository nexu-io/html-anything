
function paper(x,y,w,h,title,color='#fff'){rect(x,y,w,h,color,12);text(title,x+18,y+24,18,(/^#[0-9a-f]{6}$/i.test(color)&&[1,3,5].reduce((v,j)=>v+parseInt(color.slice(j,j+2),16),0)<350)?'#fff':'#25262b','left','Arial',600,w-35);}
function rows(x,y,w,n=4,c='#b8bdc2',gap=22){for(let j=0;j<n;j++)rect(x,y+j*gap,w*(.64+rand(j)*.32),5,c,2)}
function ring(x,y,r,c,width=3){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke()}
function pill(x,y,w,txt,c='#fff',ink='#222'){rect(x-w/2,y-22,w,44,c,22);text(txt,x,y,18,ink,'center','Arial',500,w-26)}
function arrow(x,y,xx,yy,c){line(x,y,xx,yy,c,2);let a=Math.atan2(yy-y,xx-x);poly([[xx,yy],[xx-10*cos(a-.5),yy-10*sin(a-.5)],[xx-10*cos(a+.5),yy-10*sin(a+.5)]],c)}
function header(t,color=CONFIG.palette[1]){fittedText(P.title,500,55,30,color,870,'Arial',600)}
function foot(t,color=CONFIG.palette[1]){text(CONFIG.stages[stageAt(t)].label,500,557,16,color)}
function orbitNode(x,y,r,c,labelText){ellipse(x,y,r,r,c);text(labelText,x,y,16,'#25262b','center','Arial',500,r*1.65)}
function wave(x,y,w,h,c,t,phaseOffset=0){ctx.beginPath();for(let j=0;j<=80;j++){let xx=x+j*w/80,yy=y+sin(j*.15+t+phaseOffset)*h*(.4+.6*sin(j/80*Math.PI));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke()}
function drawScene(t){bg();let q=t%5.3;for(let j=0;j<3;j++){let delay=[4.2,2.8,1.6][j],x=500;if(q>1&&q<delay)x=500+900*(q<1.5?phase(q,1,1.5):1-phase(q,delay-.4,delay));at(x,210+j*100,1,0,()=>{ctx.beginPath();ctx.moveTo(-170,-38);ctx.lineTo(40,-38);ctx.quadraticCurveTo(55,-38,62,-12);ctx.quadraticCurveTo(74,10,89,-18);ctx.quadraticCurveTo(100,-38,120,-38);ctx.lineTo(165,-38);ctx.quadraticCurveTo(180,-38,180,-23);ctx.lineTo(180,28);ctx.quadraticCurveTo(180,42,165,42);ctx.lineTo(-170,42);ctx.quadraticCurveTo(-184,42,-184,26);ctx.lineTo(-184,-23);ctx.quadraticCurveTo(-184,-38,-170,-38);ctx.strokeStyle=P.accent;ctx.lineWidth=1.5;ctx.stroke();text(['Halftone','Fractal Noise','Gradient Fill'][j],-155,11,21,P.accent,'left');text('›',152,10,32,P.accent)})}if(P.title!==CONFIG.demoTitle)text(P.title,500,540,20,P.accent)}
