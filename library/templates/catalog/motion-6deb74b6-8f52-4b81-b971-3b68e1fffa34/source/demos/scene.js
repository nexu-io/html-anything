
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){bg();let k=stageAt(t);if(k>=4){end();return}at(500,300,k>=3?mix(1,.8,stageProgress(t)):1.1,0,()=>{phone(-170,-250,340,500);text('09:41',0,-175,63,'#233428');[.6,1.7].forEach((a,i)=>alpha(phase(t,a,a+.3),()=>{rect(-150,-85+i*115+20*(1-phase(t,a,a+.3)),300,95,'#ffffffdf',18);ellipse(-122,-55+i*115,12,12,P.accent);text(i?'Assistant':'Team request',-100,-56+i*115,16,'#333','left');text(i?'Your notes are ready.':'Can you prepare a recap?',-130,-15+i*115,17,'#333','left','Arial',400,265)}));text(P.title,0,215,17,'#31553b')})}
