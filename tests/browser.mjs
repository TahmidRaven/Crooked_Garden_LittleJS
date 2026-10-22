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
  assert.equal(await page.locator('#water-label').textContent(),'580');
  assert.equal(await page.locator('#flower-label').textContent(),'0 / 3');
  assert.equal(await page.locator('#finish').isDisabled(),true);
  await point(300,300);
  await page.mouse.down();
  await page.clock.runFor(100);
  assert.ok(635-(await state()).tip.y>=12,'Pointer input moves the tip within 100ms');
  await page.clock.runFor(400);
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

  async function follow(route){
    for(const [x,y] of route){
      if((await state()).status==='won')break;
      await point(x,y);
      await page.mouse.down();
      for(let i=0;i<100;i++){
        await page.clock.runFor(100);
        const s=await state();
        assert.ok(!['blocked','dry'].includes(s.status),`Restoration route: ${s.status}`);
        if(s.status==='won'||Math.hypot(s.tip.x-x,s.tip.y-y)<12)break;
        assert.ok(i<99,'Waypoint should be reachable');
      }
      await page.mouse.up();
    }
  }
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
  await follow([[430,550]]);
  assert.deepEqual((await state()).flowers,[true,false,false]);
  assert.notEqual((await state()).status,'won','First flower does not prematurely end the attempt');
  assert.equal(await page.locator('#finish').isEnabled(),true);
  await page.locator('#finish').click();
  assert.equal((await state()).status,'won');
  assert.match(await page.locator('#result-tag').textContent(),/1 OF 3/);
  await page.locator('#result-undo').click();
  assert.deepEqual((await state()).flowers,[false,false,false],'Rewind restores dormant flowers');
  assert.equal(await page.locator('#finish').isDisabled(),true);
  await page.locator('#restart').click();
  await follow([[430,550],[500,550],[500,435],[205,390],[130,390],[130,280]]);
  assert.deepEqual((await state()).flowers,[true,true,false]);
  await page.screenshot({path:'artifacts/restoring.png',fullPage:true});
  await follow([[345,170]]);
  assert.equal((await state()).status,'won');
  assert.equal((await state()).endedBy,'complete');
  assert.deepEqual((await state()).flowers,[true,true,true]);
  assert.ok((await state()).dew.every(Boolean),'Dew detours enable the full restoration');
  assert.match(await page.locator('#result-tag').textContent(),/3 OF 3/);
  assert.equal(await page.locator('#result-undo').isVisible(),false);
  await page.screenshot({path:'artifacts/restored.png',fullPage:true});
  await page.locator('#next').click();
  assert.deepEqual((await state()).flowers,[false,false,false]);
  await page.locator('#music').click();
  await page.clock.runFor(100);
  await page.waitForFunction(()=>document.querySelector('#music').getAttribute('aria-pressed')==='true');
  await page.locator('#music').click();
  assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'false');

  const viewports=[
    [320,568],[360,640],[390,844],[430,932],
    [768,1024],[1024,768],[1280,720],[1440,900],
    [568,320],[667,375],[844,390]
  ];
  for(const [width,height] of viewports){
    await page.setViewportSize({width,height});
    await page.clock.runFor(100);
    const layout=await page.evaluate(()=>{
      const rect=selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
      };
      return {
        pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,
        board:rect('#game-root'),garden:rect('.garden'),resources:rect('.resources'),
        controls:['#finish','#undo','#restart','#music','.objective'].map(rect)
      };
    });
    const label=`${width}×${height}`;
    assert.ok(layout.pageWidth<=width+1,`${label}: no horizontal page scrolling`);
    assert.ok(layout.pageHeight<=height+1,`${label}: no vertical page scrolling (${layout.pageHeight}px)`);
    for(const r of [layout.board,...layout.controls]){
      assert.ok(r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,`${label}: board and controls are inside the viewport: ${JSON.stringify(r)}`);
    }
    assert.ok(Math.abs(layout.board.width/layout.board.height-5/6)<.005,`${label}: board is not stretched`);
    assert.ok(layout.board.width>=180,`${label}: board remains playable`);
    if(width<=720&&height>width)assert.ok(layout.garden.bottom<=layout.resources.y-2,`${label}: board does not overlap water controls`);
    if([[390,844],[1280,720],[844,390]].some(([w,h])=>width===w&&height===h)){
      await page.screenshot({path:`artifacts/layout-${width}x${height}.png`,fullPage:true});
    }
  }

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  mobile.on('pageerror',error=>errors.push(error.message));
  mobile.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await mobile.goto(url);
  await mobile.waitForFunction(()=>window.crookedGarden?.getState().points===1);
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal mobile overflow');
  await mobile.locator('#game-root').scrollIntoViewIfNeeded();
  const r=await mobile.locator('#game-root canvas').first().boundingBox();
  const x=r.x+430/600*r.width,y=r.y+550/720*r.height;
  const touch=await mobile.context().newCDPSession(mobile);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await mobile.waitForFunction(()=>window.crookedGarden.getState().flowers[0]);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await mobile.locator('#finish').tap();
  assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().status),'won');
  await mobile.screenshot({path:'artifacts/mobile.png',fullPage:true});
  assert.deepEqual(errors,[],'No runtime errors or missing assets');
  console.log('Browser checks passed: flower objectives, partial finish, full restoration via dew, rewind/reset, pointer/touch, pause, collision, music, responsive layout.');
} finally {
  await browser?.close();
  await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));
}
