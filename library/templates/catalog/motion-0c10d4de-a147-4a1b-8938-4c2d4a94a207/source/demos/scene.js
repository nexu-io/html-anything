
function win(x,y,w,h,title,dark=false){rect(x,y,w,h,dark?'#161c20':'#fff',12);rect(x,y,w,27,dark?'#252d30':'#e9ece9',10);text(title,x+18,y+14,12,dark?'#ddd':'#555','left','monospace',400,w-30)}
function phone(x,y,w,h){rect(x,y,w,h,'#f3f4f1',28);rect(x+w*.35,y+9,w*.3,8,'#222',5);rect(x+w*.36,y+h-12,w*.28,4,'#222',2)}
function lines(x,y,w,n,dark=false){for(let i=0;i<n;i++)rect(x,y+i*18,w*(.35+rand(i)*.65),4,i%4===0?P.accent:dark?'#82918a':'#bcc1b9')}
function heading(s=P.title){fittedText(s,500,58,35,ink(),900,'Arial',500)}
function end(){bg();fittedText(P.title,500,300,62,ink(),850,'Georgia')}

function drawScene(t){bg();let k=stageAt(t);if(k>=9){end();return}const points=wordPoints(k<3?'道':P.title,150);if(k<=3){let u=k<2?phase(t,0,2):1-phase(t,3,4);points.forEach(([x,y],i)=>{ellipse(500+x*u+(rand(i)-.5)*500*(1-u),280+y*u+(rand(i+5)-.5)*340*(1-u),2.3,2.3,ink())})}else if(k<=5){const n=k===4?3:3;for(let g=0;g<n;g++){let cx=250+g*250;for(let i=0;i<50;i++){let a=rand(i)*TAU+t*.1,x=cx+cos(a)*65,y=130+rand(i+9)*310;ellipse(x,y,2,2,ink());line(cx,280,x,y,'#70766c35',1)}}}else if(k===6){for(let i=0;i<260;i++){let a=rand(i)*TAU+t*.15,r=Math.sqrt(rand(i+5))*150;ellipse(500+cos(a)*r,300+sin(a)*r,2,2,P.accent)}}else{for(let i=0;i<18;i++){let x=90+i%6*160,y=130+Math.floor(i/6)*140;rect(x-55,y-45,110,90,'#f2f1e9',3);ellipse(x,y,25,35,null,P.accent)}}text(P.title,500,550,26,ink())}
