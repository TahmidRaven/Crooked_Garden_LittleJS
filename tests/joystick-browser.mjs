import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.clock.install();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
  await page.clock.pauseAt(new Date(Date.now()+1000));
  // Breathing keeps the bounding box animated; tap its centre without waiting for stillness.
  await page.locator('#play').tap({force:true});
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  assert.equal(await page.locator('#joystick').isVisible(),false,'No fixed joystick before touching');
  const x=150,y=620;
  const first={x,y:y-40,id:1};
  const start=await state();
  await touch('touchStart',[{x,y,id:1}]);await page.clock.runFor(100);
  const origin=await page.locator('#joystick').boundingBox();
  assert.ok(Math.abs(origin.x+origin.width/2-x)<1&&Math.abs(origin.y+origin.height/2-y)<1,'Joystick appears centred at the actual touch');
  assert.equal((await state()).points,start.points,'Neutral stick does not start growth');
  await touch('touchMove',[first]);await page.clock.runFor(100);
  const moved=await state();assert.ok(moved.tip.y<start.tip.y-10,'Up moves the vine up without pointing at the garden');
  assert.ok(Math.abs(moved.tip.x-start.tip.x)<2,'The stick steers relative to the tip');
  // Burst while the first finger stays captured by the stick.
  const b=await page.locator('#boost').boundingBox(),second={x:b.x+b.width/2,y:b.y+b.height/2,id:2};
  await touch('touchStart',[first,second]);await touch('touchEnd',[second]);await page.clock.runFor(50);
  assert.ok((await state()).burst>0,'Second-finger Burst works while holding the joystick');
  await touch('touchEnd',[]);const released=await state();await page.clock.runFor(100);
  assert.equal((await state()).points,released.points,'Release stops growth');
  assert.equal(await page.locator('#joystick').isVisible(),false,'Release hides the floating joystick');
  assert.equal(await page.locator('#joystick').evaluate(el=>el.style.getPropertyValue('--stick-x')),'0px');
  await touch('touchStart',[first]);await page.clock.runFor(50);await touch('touchCancel',[]);
  const cancelled=await state();await page.clock.runFor(100);assert.equal((await state()).points,cancelled.points,'Touch cancellation stops growth');
  await touch('touchStart',[first]);await page.clock.runFor(50);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal((await state()).phase,'paused');await touch('touchEnd',[]);await page.locator('#resume').tap();
  const resumed=await state();await page.clock.runFor(100);assert.equal((await state()).points,resumed.points,'Pause clears held stick input');
  await mkdir('artifacts',{recursive:true});
  for(const [width,height] of [[390,844],[320,568],[568,320],[844,390],[960,720]]){
    await page.setViewportSize({width,height});await page.clock.runFor(50);
    const boxes=await page.evaluate(()=>['boost','undo','restart'].map(id=>{
      const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};
    }));
    for(const b of boxes)assert.ok(b.x>=0&&b.y>=0&&b.right<=width+1&&b.bottom<=height+1,`${width}×${height}: ${b.id} is visible`);
    const anchor={x:width*.25,y:height*.65,id:1};
    await touch('touchStart',[anchor]);await touch('touchMove',[{...anchor,x:anchor.x+25,y:anchor.y-20}]);
    const stick=await page.locator('#joystick').boundingBox();
    assert.ok(Math.abs(stick.x+stick.width/2-anchor.x)<1&&Math.abs(stick.y+stick.height/2-anchor.y)<1,`${width}×${height}: floating joystick anchors under the finger`);
    await page.screenshot({path:`artifacts/joystick-${width}x${height}.png`});
    await touch('touchEnd',[]);
  }
  await page.mouse.move(300,400);
  assert.equal(await page.locator('#joystick').isVisible(),false,'Hover does not open the joystick');
  assert.match(await page.locator('#game-root').evaluate(el=>getComputedStyle(el).cursor),/data:image\/svg\+xml/,'Desktop has a small custom dot cursor');
  await page.mouse.down();
  const mouseOrigin=await page.locator('#joystick').boundingBox();
  assert.ok(Math.abs(mouseOrigin.x+mouseOrigin.width/2-300)<1&&Math.abs(mouseOrigin.y+mouseOrigin.height/2-400)<1,'Mouse click anchors the joystick at the cursor');
  assert.equal(await page.locator('#game-root').evaluate(el=>getComputedStyle(el).cursor),'none','The knob replaces the cursor while dragging');
  const mouseStart=await state();await page.mouse.move(300,360);await page.clock.runFor(100);
  assert.ok((await state()).points>mouseStart.points,'Mouse drag grows the vine');
  await page.mouse.up();assert.equal(await page.locator('#joystick').isVisible(),false);
  await page.locator('#pause').click();assert.equal(await page.locator('#joystick').isVisible(),false,'UI clicks never open a joystick');
  await page.locator('#resume').click();
  assert.equal(await page.locator('#joystick-controls').evaluate(el=>getComputedStyle(el).opacity),'0.45','The entire joystick is translucent');
  assert.deepEqual(errors,[]);
  console.log('Floating joystick checks passed: touch/mouse anchors, dot cursor, hover, drag, release, cancel, multitouch Burst, pause and five layouts.');
}finally{
  await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));
}
