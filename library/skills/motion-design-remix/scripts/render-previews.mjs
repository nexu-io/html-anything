import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {readFile,mkdir,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
assert(process.argv[2] && process.argv[3] && process.env.MOTION_BROWSER_PATH, 'Set MOTION_BROWSER_PATH and pass <projects-root> <new-output-dir> [profile] [--stills]');
const root=path.resolve(process.argv[2]);
const out=path.resolve(process.argv[3]);
await mkdir(path.dirname(out),{recursive:true});
await mkdir(out);
const mime={'.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml','.ttf':'font/ttf','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.statusCode=404;res.end('Not found')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const profile=await mkdtemp(path.join(tmpdir(),'motion-remix-render-'));
const browser=await puppeteer.launch({executablePath:process.env.MOTION_BROWSER_PATH,headless:true,userDataDir:profile,defaultViewport:{width:1920,height:1080,deviceScaleFactor:0.5},args:['--no-first-run','--enable-unsafe-swiftshader','--enable-features=CanvasDrawElement']});
const plan=[['ui-3d-reveal',3,5.5],['wireframe-portal-title',0,6],['canopy-part-title',0.25,5.5],['code-3d-extrude',0,5],['code-particle-assemble',0,5],['liquid-glass-widgets',0,6]];
const selected=process.argv[4]?.startsWith("--") ? undefined : process.argv[4];const frames=!process.argv.includes("--stills");const report=[];
if(selected)assert(plan.some(x=>x[0]===selected), "Unknown profile");
const browserVersion=await browser.version();
try{
for(const [id,start,duration] of plan.filter(x=>!selected||x[0]===selected))for(const variant of ['reference','remix']){
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
 await page.evaluateOnNewDocument(()=>{let seed=42;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};window.__hyperframes={getVariables(){const a=JSON.parse(document.documentElement.getAttribute('data-composition-variables')||'[]');return Object.fromEntries(a.map(x=>[x.id,x.default]));}}});
 await page.goto(`http://127.0.0.1:${server.address().port}/${id}/${variant}/index.html`,{waitUntil:'networkidle0',timeout:90000});
 await page.waitForFunction(()=>Object.keys(window.__timelines||{}).length>0,{timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 if(id==='wireframe-portal-title')await page.waitForFunction(()=>typeof window.__wptRender==='function',{timeout:60000});
 const output=`${out}/frames/${id}/${variant}`;await mkdir(output,{recursive:true});
 const ts=frames?Array.from({length:Math.round(duration*12)},(_,i)=>start+i/12):[start+0.2,start+duration/2,start+duration-0.2];
 for(let i=0;i<ts.length;i++){
  await page.evaluate(t=>{for(const tl of Object.values(window.__timelines))tl.pause().time(t,false);window.dispatchEvent(new CustomEvent('hf-seek',{detail:{time:t}}));},ts[i]);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:`${output}/${String(i).padStart(4,'0')}.png`});
 }
 const row={id,variant,start,duration,fps:12,frames:ts.length,browserVersion,errors};report.push(row);console.log(JSON.stringify(row));await page.close();assert.equal(errors.length,0,'Source load or execution errors: '+errors.join('; '));
}
}finally{await writeFile(path.join(out,'render-report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));await rm(profile,{recursive:true,force:true});}
