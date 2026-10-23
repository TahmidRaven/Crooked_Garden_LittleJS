import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
const browser=await chromium.launch({headless:true});
try{
  await mkdir('screenshots',{recursive:true});
  let page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2});
  await page.addInitScript(()=>Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(42);return array;}}));
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
  await page.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));
  await page.screenshot({path:'screenshots/01-title.png',fullPage:true});
  await page.locator('#play').click();
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  async function grow(x,y,stopOnCapture=false){
    const {view:v}=await state(),r=await page.locator('#game-root canvas').boundingBox();
    await page.mouse.move(r.x+(v.x+x*v.scale)/v.width*r.width,r.y+(v.y+y*v.scale)/v.height*r.height);
    await page.mouse.down();
    for(let i=0;i<200;i++){
      const before=await state();
      if(before.cooldown<=0&&before.burst<=0&&before.bugs.some(b=>!b.captured&&!b.stunned&&Math.hypot(before.tip.x-b.x,before.tip.y-b.y)<65))await page.keyboard.press('Shift');
      await page.clock.runFor(50);
      const after=await state();
      if(after.phase==='result'){assert.ok(after.flowers.every(Boolean));break;}
      assert.equal(after.phase,'playing');
      if((stopOnCapture&&after.captures)||Math.hypot(after.tip.x-x,after.tip.y-y)<8)break;
      assert.ok(i<199);
    }
    await page.mouse.up();
  }
  for(const [x,y] of [[430,550],[500,550],[500,435],[380,435],[380,360],[300,360],[300,435],[395,435]]){
    await grow(x,y,true);
    if(x===300&&y===360){
      assert.equal((await state()).captures,0);
      assert.ok((await state()).bugs.every(b=>!b.captured));
      await page.screenshot({path:'screenshots/08-bugs-before-capture.png',fullPage:true});
    }
    if((await state()).captures)break;
  }
  assert.equal((await state()).captures,2);
  await page.screenshot({path:'screenshots/02-double-catch.png',fullPage:true});
  await page.locator('#undo').click();
  for(const [x,y] of [[205,390],[130,390],[130,280]])await grow(x,y);
  assert.equal((await state()).flowers.filter(Boolean).length,2);
  await page.screenshot({path:'screenshots/03-garden-progress.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.clock.runFor(100);
  await page.screenshot({path:'screenshots/04-mobile-progress.png',fullPage:true});
  await page.setViewportSize({width:1280,height:800});
  await page.clock.runFor(100);
  await grow(345,170);
  assert.ok((await state()).flowers.every(Boolean));
  await page.screenshot({path:'screenshots/05-garden-restored.png',fullPage:true});
  console.log('Capture run:',JSON.stringify(await state()));
  page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2});
  await page.addInitScript(()=>Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(97);return array;}}));
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
  await page.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));
  await page.locator('#play').click();
  for(const [x,y] of [[430,550],[500,550],[500,435],[205,390]])await grow(x,y);
  assert.equal((await state()).flowers.filter(Boolean).length,2);
  assert.ok((await state()).bugs.every(b=>!b.captured));
  await page.screenshot({path:'screenshots/09-progress-with-bugs.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.clock.runFor(100);
  await page.screenshot({path:'screenshots/10-mobile-with-bugs.png',fullPage:true});
  console.log('Visible-bug run:',JSON.stringify(await state()));
}finally{
  await browser.close();
  await new Promise(resolve=>server.httpServer.close(resolve));
}
