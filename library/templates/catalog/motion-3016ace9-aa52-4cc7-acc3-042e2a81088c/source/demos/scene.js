
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function car(x,y,c){rect(x-50,y-18,100,36,c,12);rect(x-25,y-29,50,58,c,10);for(let i of[-1,1])for(let j of[-1,1])rect(x+i*38-7,y+j*22-4,14,8,'#222',2);rect(x-16,y-18,32,36,'#c9dbe4',4)}
function drawScene(t){bg();let k=stageAt(t);if(k===3||k>=7){end();return}heading();if(k<=2){phone(340,105,320,455);rect(360,145,280,365,'#657269',8);for(let i=0;i<8;i++)rect(495,150+(i*58+t*90)%350,10,30,'#fff8');car(500+sin(t*1.2)*55,365,k===2?P.accent:'#d0e2da');text('Choose a style',500,538,16,ink())}else{win(130,140,740,360,'Project workspace');for(let i=0;i<6;i++){rect(155+i%3*230,205+Math.floor(i/3)*115,210,95,i===0?P.accent:'#e7e9e4',8);lines(170+i%3*230,229+Math.floor(i/3)*115,170,3)}if(k===6){rect(700,445,140,40,P.accent,8);text('Publish',770,465,21,'#fff');cursor(800,480);alpha(phase(stageProgress(t),.5,.8),()=>{rect(330,275,340,75,'#25352c',10);text('Published',500,313,27,'#fff')})}}}
