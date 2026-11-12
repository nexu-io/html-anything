
function paper(x,y,w,h,title,color='#fff'){rect(x,y,w,h,color,12);text(title,x+18,y+24,18,(/^#[0-9a-f]{6}$/i.test(color)&&[1,3,5].reduce((v,j)=>v+parseInt(color.slice(j,j+2),16),0)<350)?'#fff':'#25262b','left','Arial',600,w-35);}
function rows(x,y,w,n=4,c='#b8bdc2',gap=22){for(let j=0;j<n;j++)rect(x,y+j*gap,w*(.64+rand(j)*.32),5,c,2)}
function ring(x,y,r,c,width=3){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke()}
function pill(x,y,w,txt,c='#fff',ink='#222'){rect(x-w/2,y-22,w,44,c,22);text(txt,x,y,18,ink,'center','Arial',500,w-26)}
function arrow(x,y,xx,yy,c){line(x,y,xx,yy,c,2);let a=Math.atan2(yy-y,xx-x);poly([[xx,yy],[xx-10*cos(a-.5),yy-10*sin(a-.5)],[xx-10*cos(a+.5),yy-10*sin(a+.5)]],c)}
function header(t,color=CONFIG.palette[1]){fittedText(P.title,500,55,30,color,870,'Arial',600)}
function foot(t,color=CONFIG.palette[1]){text(CONFIG.stages[stageAt(t)].label,500,557,16,color)}
function orbitNode(x,y,r,c,labelText){ellipse(x,y,r,r,c);text(labelText,x,y,16,'#25262b','center','Arial',500,r*1.65)}
function wave(x,y,w,h,c,t,phaseOffset=0){ctx.beginPath();for(let j=0;j<=80;j++){let xx=x+j*w/80,yy=y+sin(j*.15+t+phaseOffset)*h*(.4+.6*sin(j/80*Math.PI));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke()}
function drawScene(t){let n=stageAt(t),u=stageProgress(t);let purple=n>=3&&n<CONFIG.stages.length-1;bg(purple?'#430453':'#10362f');let c=purple?P.accent:'#dfff58';let words=["TIDAL", "TO ALL THE", "NEWBIES", "TIDAL IS HERE", "MUSIC", "FANS", "TIDAL FOR YOUR MUSIC"];let q=1+sin(u*Math.PI)*.04;at(500,300,q,-.035*sin(u*TAU),()=>{ctx.scale(.78,1.23);let txt=useTitle(words[n]);let arr=txt.split(' ');if(arr.length>3){text(arr.slice(0,2).join(' '),0,-80,66,c,'center','Impact',900,950);text(arr.slice(2).join(' '),0,35,88,c,'center','Impact',900,950)}else fittedText(txt,0,0,110,c,1100,'Impact',900)});let wipe=clamp(1-u*5);if(wipe>.02)at(500,300,1,Math.PI/4,()=>rect(-800*wipe,-800*wipe,1600*wipe,1600*wipe,purple?'#c400e8':'#1b998d'));if(n!==0)text('TO ALL THE',500,130,24,purple?'#c400e8':'#1b998d','center','Impact',600);}
