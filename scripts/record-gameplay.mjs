// Real-time viewport recording using the actual floating-stick, Shift and Z controls.
// No simulation clock overrides, injected garden state, pasted footage or fake scores.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const version4=process.argv.includes('--v4');
const directory=version4?'artifacts/gameplay-video-v4':'artifacts/gameplay-video';
await mkdir(directory,{recursive:true});
await mkdir('screenshots',{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
let browser,context;
try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:directory,size:{width:1920,height:1080}}});
  const videoStarted=Date.now();
  const page=await context.newPage();
  await page.addInitScript(seed=>{
    // Reproducible randomness only, not pre-baked enemies, captures or scores.
    Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(seed);return array;}});
    const NativeAudioContext=window.AudioContext,NativeAudio=window.Audio;
    const mix=new NativeAudioContext(),output=mix.createMediaStreamDestination(),taps=new Map();
    const originalConnect=AudioNode.prototype.connect;
    AudioNode.prototype.connect=function(destination,...args){
      const result=originalConnect.call(this,destination,...args);
      if(destination===mix.destination)originalConnect.call(this,output);
      else if(destination instanceof AudioDestinationNode){
        let tap=taps.get(this.context);
        if(!tap){
          tap=this.context.createMediaStreamDestination();taps.set(this.context,tap);
          originalConnect.call(mix.createMediaStreamSource(tap.stream),output);
        }
        originalConnect.call(this,tap);
      }
      return result;
    };
    // Capture the real HTML music element and real synthesized WebAudio effects.
    function CapturedAudio(...args){
      const element=new NativeAudio(...args);
      mix.createMediaElementSource(element).connect(mix.destination);
      return element;
    }
    CapturedAudio.prototype=NativeAudio.prototype;window.Audio=CapturedAudio;
    const chunks=[],recorder=new MediaRecorder(output.stream,{mimeType:'audio/webm;codecs=opus'});
    recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#play')&&recorder.state==='inactive'){
        window.__audioStartedWall=Date.now();void mix.resume();recorder.start(250);
      }
    },true);
    window.__stopRecordedAudio=()=>new Promise(resolve=>{
      recorder.onstop=async()=>{
        const bytes=new Uint8Array(await new Blob(chunks,{type:'audio/webm'}).arrayBuffer());
        let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
        resolve({base64:btoa(binary),started:window.__audioStartedWall});
      };
      recorder.stop();
    });
  },version4?41:42);
  const events=[];
  const mark=async feature=>events.push({feature,wall:Date.now(),state:await page.evaluate(()=>window.crookedGarden.getState())});
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
  const trimStart=(Date.now()-videoStarted)/1000;
  await mark('Title and animated menu');
  await page.waitForTimeout(2200);
  await page.locator('#play').click({force:true});
  await mark('Floating joystick and growth');
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  if(version4){
    // A real terrain loss, then a paid retry: show the new recovery hierarchy.
    await page.mouse.move(260,780);await page.mouse.down();await page.mouse.move(260,732);
    await page.waitForFunction(()=>window.crookedGarden.getState().phase==='result');await page.mouse.up();
    await mark('Updated loss screen: primary Rewind and secondary Retry');
    await page.waitForTimeout(1500);
    await page.locator('#next').click();
    assert.equal((await state()).retriesLeft,2);assert.equal((await state()).retryPenalty,300);
    await mark('Retry: minus 300 points, two run-wide retries remaining');
    await page.waitForTimeout(1100);
  }
  async function grow(x,y,stopOnCapture=false){
    const anchor={x:260,y:780};
    await page.mouse.move(anchor.x,anchor.y);await page.mouse.down();
    try{
      await page.evaluate(({x,y,anchor,stopOnCapture})=>new Promise((resolve,reject)=>{
        const root=document.getElementById('game-root'),started=performance.now();let keyHeld=false;
        const timer=setInterval(()=>{
          const s=window.crookedGarden.getState();
          if(s.phase!=='playing'){
            clearInterval(timer);
            if(s.phase==='result'&&s.flowers.every(Boolean))resolve();
            else reject(Error(`Unexpected ${s.phase}: ${s.endedBy} at ${s.tip.x},${s.tip.y}`));
            return;
          }
          const dx=x-s.tip.x,dy=y-s.tip.y,length=Math.hypot(dx,dy)||1;
          if((stopOnCapture&&s.captures)||length<8){clearInterval(timer);resolve();return;}
          root.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,pointerType:'mouse',isPrimary:true,buttons:1,clientX:anchor.x+48*dx/length,clientY:anchor.y+48*dy/length}));
          if(!keyHeld&&s.cooldown<=0&&s.burst<=0&&s.water>30&&s.bugs.some(b=>!b.captured&&!b.stunned&&Math.hypot(s.tip.x-b.x,s.tip.y-b.y)<65)){
            keyHeld=true;
            root.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Shift',code:'ShiftLeft'}));
            setTimeout(()=>{root.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Shift',code:'ShiftLeft'}));keyHeld=false;},50);
          }
          if(performance.now()-started>12000){clearInterval(timer);reject(Error(`Unreachable waypoint ${x},${y}`));}
        },16);
      }),{x,y,anchor,stopOnCapture});
    }finally{await page.mouse.up();}
  }
  for(const [x,y] of [[430,550],[500,550],[500,435],[380,435],[380,380],[360,360],[300,360],[300,435],[395,435]]){
    await grow(x,y,true);
    if((await state()).captures)break;
  }
  assert.ok((await state()).captures>0,'The footage must include a genuine capture');
  await mark('Closed-loop catch, water refund and score');
  await page.waitForTimeout(1000);
  await page.keyboard.press('z');
  assert.equal((await state()).rewindsLeft,2);
  await mark('Rewind: minus 100 points, two uses remaining');
  await page.waitForTimeout(1100);
  for(const [x,y] of [[205,390],[130,390],[130,280],[345,170]])await grow(x,y);
  assert.ok((await state()).flowers.every(Boolean));
  await mark('First garden complete');
  await page.waitForTimeout(1800);
  const routes=[
    [[425,570],[425,455],[205,420],[205,300],[405,275],[405,160]],
    [[205,590],[205,475],[410,450],[410,335],[205,310],[205,190]]
  ];
  for(const route of routes){
    await page.locator('#next').click();
    await mark(`Garden ${(await state()).stage+1}: new terrain and swarm`);
    for(const [x,y] of route)await grow(x,y);
    assert.ok((await state()).flowers.every(Boolean));
    await page.waitForTimeout(1500);
  }
  await mark('Three gardens restored; score sharing available, no score submitted');
  await page.waitForTimeout(2200);
  await page.locator('#result-leaderboard').click();
  await page.waitForFunction(()=>!document.getElementById('leaderboard-refresh').disabled);
  await mark('Live global leaderboard, read only');
  await page.waitForTimeout(2000);
  await page.locator('#leaderboard-back').click();
  await page.waitForTimeout(1500);
  const trimEnd=(Date.now()-videoStarted)/1000;
  const audio=await page.evaluate(()=>window.__stopRecordedAudio());
  const audioPath=`${directory}/game-audio.webm`;
  await writeFile(audioPath,Buffer.from(audio.base64,'base64'));
  const video=page.video();await context.close();context=null;
  const rawVideo=await video.path();
  const output=version4?'screenshots/crooked-garden-gameplay-v4-1920x1080.mp4':'screenshots/crooked-garden-gameplay-1920x1080.mp4';
  const audioOffset=(audio.started-videoStarted)/1000;
  const encoded=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','warning',
    '-i',rawVideo,'-itsoffset',String(audioOffset),'-i',audioPath,
    '-ss',String(trimStart),'-t',String(trimEnd-trimStart),
    '-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','20',
    '-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','160k','-movflags','+faststart',output],{stdio:'inherit'});
  if(encoded.error)throw encoded.error;assert.equal(encoded.status,0);
  await writeFile(`${directory}/recording.json`,JSON.stringify({output,rawVideo,audioPath,trimStart,trimEnd,audioOffset,
    method:'Real-time browser viewport and actual mixed game audio; input events only; seeded randomness; no game-state injection; no score submissions.',events},null,2)+'\n');
  console.log(`Recorded ${Math.round(trimEnd-trimStart)} seconds: ${output}`);
}finally{
  await context?.close();await browser?.close();
  await new Promise(resolve=>server.httpServer.close(resolve));
}
