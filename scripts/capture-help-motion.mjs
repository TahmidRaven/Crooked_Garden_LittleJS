// Actual pointer/Shift gameplay; no injected simulation state or synthetic frames.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const output='artifacts/help-motion';
await mkdir(output,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2});
  await page.addInitScript(()=>Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(42);return array;}}));
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
  await page.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));
  await page.locator('#play').click();
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  const frames={grow:[],loop:[]};
  const clips={grow:{x:590,y:475,width:265,height:205},loop:{x:565,y:325,width:300,height:205}};
  async function frame(kind){
    const s=await state(),path=`${output}/${kind}-${String(frames[kind].length).padStart(3,'0')}.png`;
    await page.screenshot({path,clip:clips[kind]});
    frames[kind].push({path,burst:s.burst,captures:s.captures});
  }
  async function grow(x,y,kind){
    const {view:v}=await state();
    await page.mouse.move(v.x+x*v.scale,v.y+y*v.scale);
    await page.mouse.down();
    for(let i=0;i<200;i++){
      const before=await state();
      if(before.cooldown<=0&&before.burst<=0&&before.bugs.some(b=>!b.captured&&!b.stunned&&Math.hypot(before.tip.x-b.x,before.tip.y-b.y)<65))await page.keyboard.press('Shift');
      await page.clock.runFor(100);
      const s=await state();assert.equal(s.phase,'playing');
      if(kind)await frame(kind);
      if(s.captures||Math.hypot(s.tip.x-x,s.tip.y-y)<10)break;
      assert.ok(i<199);
    }
    await page.mouse.up();
  }
  await frame('grow');
  for(const [x,y]of [[430,550],[500,550]])await grow(x,y,'grow');
  await grow(500,435);
  await frame('loop');
  for(const [x,y]of [[380,435],[380,360],[300,360],[300,435],[395,435]]){
    await grow(x,y,'loop');
    if((await state()).captures)break;
  }
  assert.equal((await state()).captures,2);
  assert.ok(frames.loop.some(frame=>frame.burst>0),'The recorded encounter includes a real Burst');
  await writeFile(`${output}/frames.json`,JSON.stringify(frames,null,2)+'\n');
  console.log(`Recorded ${frames.grow.length} steering frames and ${frames.loop.length} loop/Burst frames.`);
}finally{
  await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));
}
