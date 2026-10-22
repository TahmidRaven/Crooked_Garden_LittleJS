import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

// Test the production build, with real input and no simulation shortcuts.
const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
let browser;
try {
  const {port}=server.httpServer.address();
  const url=`http://127.0.0.1:${port}`;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await page.goto(url);
  await page.waitForFunction(()=>window.crookedGarden?.getState().points===1);
  await page.clock.pauseAt(new Date('2026-10-22T12:00:02Z'));
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  const canvas=page.locator('#game-root canvas').first();
  const point=async(x,y)=>{
    const r=await canvas.boundingBox();
    await page.mouse.move(r.x+x/600*r.width,r.y+y/720*r.height);
  };
  assert.equal(await page.locator('#water').getAttribute('max'),'1100');
  assert.equal(await page.locator('#water-label').textContent(),'71%');
  await point(300,300);
  await page.mouse.down();
  await page.clock.runFor(500);
  await page.mouse.up();
  const growing=await state();
  assert.ok(growing.points>10,'Pointer grows the vine');
  await page.clock.runFor(300);
  assert.equal((await state()).points,growing.points,'Release pauses growth');
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  await page.keyboard.down('g');
  await page.clock.runFor(300);
  await page.keyboard.up('g');
  assert.equal((await state()).points,growing.points,'Space pauses keyboard growth');
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  await page.keyboard.down('g');
  await page.clock.runFor(4000);
  await page.keyboard.up('g');
  assert.equal((await state()).status,'blocked');
  assert.equal(await page.locator('#result').isVisible(),true);
  await page.locator('#result-undo').click();
  assert.equal((await state()).status,'ready');
  assert.equal(await page.locator('#result').isVisible(),false);
  await page.locator('#restart').click();
  assert.equal((await state()).points,1);

  const routes=[
    [[425,550],[425,420],[205,380],[205,270],[345,170],[290,95]],
    [[425,570],[425,455],[205,420],[205,300],[405,275],[405,160],[390,90]],
    [[205,590],[205,475],[410,450],[410,335],[205,310],[205,190],[275,90]]
  ];
  for(let index=0;index<routes.length;index++){
    for(const [x,y] of routes[index]){
      if((await state()).status==='won')break;
      await point(x,y);
      await page.mouse.down();
      for(let i=0;i<100;i++){
        await page.clock.runFor(100);
        const s=await state();
        assert.ok(!['blocked','dry'].includes(s.status),`Garden ${index+1}: ${s.status}`);
        if(s.status==='won'||Math.hypot(s.tip.x-x,s.tip.y-y)<12)break;
        assert.ok(i<99,'Waypoint should be reachable');
      }
      await page.mouse.up();
    }
    assert.equal((await state()).status,'won',`Garden ${index+1} can be completed`);
    assert.ok((await state()).dew.some(Boolean),'Dew is collected using real input');
    assert.equal(await page.locator('#result-undo').isVisible(),false);
    await page.locator('#next').click();
    assert.equal((await state()).level,(index+1)%3);
  }
  await page.locator('#music').click();
  await page.clock.runFor(100);
  await page.waitForFunction(()=>document.querySelector('#music').getAttribute('aria-pressed')==='true');
  await page.locator('#music').click();
  assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'false');
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/desktop.png',fullPage:true});

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  mobile.on('pageerror',error=>errors.push(error.message));
  await mobile.goto(url);
  await mobile.waitForFunction(()=>window.crookedGarden?.getState().points===1);
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal mobile overflow');
  const r=await mobile.locator('#game-root canvas').first().boundingBox();
  const x=r.x+425/600*r.width,y=r.y+550/720*r.height;
  const touch=await mobile.context().newCDPSession(mobile);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await mobile.waitForFunction(()=>window.crookedGarden.getState().points>5);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await mobile.screenshot({path:'artifacts/mobile.png',fullPage:true});
  assert.deepEqual(errors,[],'No runtime errors or missing assets');
  console.log('Browser checks passed: all three gardens, pointer/touch, pause, collision, rewind, restart, music, responsive layout.');
} finally {
  await browser?.close();
  await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));
}
