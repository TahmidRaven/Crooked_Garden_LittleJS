import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:600,height:906}});
  await page.addInitScript(()=>{
    window.__guideDraws=0;
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
      if(image?.src?.endsWith('/tutorial-hand.png'))window.__guideDraws++;
      return draw.call(this,image,...args);
    };
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
  await page.clock.install();await page.clock.pauseAt(new Date());
  await page.locator('#play').click();await page.clock.runFor(100);
  assert.ok(await page.evaluate(()=>window.__guideDraws>0));
  await page.mouse.move(260,730);await page.mouse.down();await page.mouse.move(300,730);
  await page.clock.runFor(100);await page.mouse.up();
  const draws=await page.evaluate(()=>window.__guideDraws);
  await page.clock.runFor(5000);
  assert.equal(await page.evaluate(()=>window.__guideDraws),draws,'No premature idle guide');
  const before=await page.evaluate(()=>window.crookedGarden.getState());
  await page.clock.runFor(1200);
  const after=await page.evaluate(()=>window.crookedGarden.getState());
  assert.equal(after.phase,'playing');assert.ok(await page.evaluate(()=>window.__guideDraws)>draws,'Guide returns after six idle seconds');
  assert.deepEqual(after.tip,before.tip);assert.equal(after.water,before.water,'Guidance does not spend water');
  await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/idle-guide-live.png'});
  await page.locator('#pause').click();const pausedDraws=await page.evaluate(()=>window.__guideDraws);
  await page.clock.runFor(7000);assert.equal(await page.evaluate(()=>window.__guideDraws),pausedDraws,'Paused menus never draw the guide');
  await page.locator('#resume').click();
  await page.mouse.move(260,730);await page.mouse.down();await page.mouse.move(300,730);await page.clock.runFor(100);
  const dismissed=await page.evaluate(()=>window.__guideDraws);await page.clock.runFor(100);
  assert.equal(await page.evaluate(()=>window.__guideDraws),dismissed,'Resuming movement dismisses guidance');await page.mouse.up();
  console.log('Idle guide checks passed: initial guide, six-second return, no autoplay growth/water use, pause and input dismissal.');
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
