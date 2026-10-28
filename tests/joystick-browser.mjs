import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
  await page.route('https://jzixrgkpvbypiyfnshjq.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'[]'}));
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const clockStart=new Date('2026-10-27T12:00:00Z');
  await page.clock.install({time:clockStart});await page.clock.pauseAt(clockStart);
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.clock.runFor(3000);
  await page.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
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
  assert.equal((await state()).rewindsLeft,3);
  for(let used=1;used<=3;used++){
    // Include a complete UI refresh interval before checking the rewind button.
    await page.mouse.move(300,400);await page.mouse.down();await page.mouse.move(300,360);await page.clock.runFor(100);await page.mouse.up();
    await page.locator('#undo').click();
    assert.equal((await state()).rewindsLeft,3-used);assert.equal((await state()).rewindPenalty,used*100);
    assert.match(await page.locator('#state-label').textContent(),/−100 PTS/);
    if(used===1){
      await page.clock.runFor(20);await page.screenshot({path:'artifacts/rewind-penalty.png'});
      await page.locator('#restart').click();
      assert.equal((await state()).rewindsLeft,2,'Retrying garden 1 must not reset the run allowance');
      assert.equal((await state()).rewindPenalty,100,'Retrying cannot erase the penalty');
    }
  }
  await page.mouse.move(300,400);await page.mouse.down();await page.mouse.move(300,360);await page.clock.runFor(50);await page.mouse.up();
  assert.equal(await page.locator('#undo').isDisabled(),true);
  const exhausted=await state();await page.keyboard.press('z');
  assert.equal((await state()).points,exhausted.points,'Keyboard cannot bypass an exhausted allowance');
  assert.equal((await state()).rewindPenalty,300);
  await page.mouse.move(300,400);await page.mouse.down();await page.mouse.move(300,360);await page.clock.runFor(2000);await page.mouse.up();
  assert.equal((await state()).phase,'result');assert.equal(await page.locator('#result-undo').isVisible(),false,'No result-screen recovery after three uses');
  await page.locator('#next').click();assert.equal((await state()).rewindsLeft,0,'A failed-garden retry is not a new run');
  assert.equal((await state()).retriesLeft,1);assert.equal((await state()).retryPenalty,600);
  await page.keyboard.press('r');await page.clock.runFor(20);
  assert.equal((await state()).retriesLeft,0);assert.equal((await state()).retryPenalty,900);
  assert.equal(await page.locator('#restart').isDisabled(),true);
  const noRetries=await state();await page.keyboard.press('r');
  assert.equal((await state()).seed,noRetries.seed,'R cannot bypass exhausted retries');
  await page.locator('#pause').click();assert.equal(await page.locator('#pause-retry').isDisabled(),true);await page.locator('#resume').click();
  await page.mouse.move(300,400);await page.mouse.down();await page.mouse.move(300,360);await page.clock.runFor(2000);await page.mouse.up();
  assert.equal((await state()).phase,'result');assert.equal(await page.locator('#next-label').textContent(),'New Run');
  await page.locator('#next').click();
  assert.equal((await state()).rewindsLeft,3);assert.equal((await state()).rewindPenalty,0,'Starting a genuinely new run restores the allowance');
  assert.equal((await state()).retriesLeft,3);assert.equal((await state()).retryPenalty,0);
  assert.deepEqual(errors,[]);
  console.log('Controls checks passed: floating stick, three rewinds + three retries per entire run, -100/-300 feedback, exhausted keyboard/pause guards and new-run reset.');
}finally{
  await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));
}
