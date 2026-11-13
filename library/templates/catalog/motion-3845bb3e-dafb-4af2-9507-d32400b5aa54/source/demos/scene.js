
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){bg();grid('#ffffff44',26);let k=stageAt(t);if(k===0||k===8){end();return}heading();phone(60,135,240,390);text('Control device',180,180,16,ink());rect(80,225,200,85,'#fff',12);text('Prepare and send',180,265,18,ink());win(460,135,490,350,'Desktop execution');line(320,320,440,320,P.accent,3);ellipse(325+105*frac(t*.5),320,5,5,'#fff');const labels=['Connect device','Connect device','Receive request','Read task','Search sources','Locate files','Edit slides','Send result'];text(labels[k],705,195,24,ink());if(k===6){rect(500,245,400,185,P.accent,5);text('Project update',700,325,35,'#fff')}else if(k===7){lines(500,250,350,6);rect(790,420,110,32,P.accent,5);text('Send',845,436,17,'#fff')}else lines(500,240,350,8)}
