import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
let browser;
try{
  const url=`http://127.0.0.1:${server.httpServer.address().port}`;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  function watch(p){
    p.on('pageerror',error=>errors.push(error.message));
    p.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  }
  // Seed the source of randomness, not game state. Retries still receive new seeds.
  const seedSource=()=>Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(12344);return array;}});
  watch(page);await page.addInitScript(seedSource);
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await page.goto(url);
  await page.waitForFunction(()=>window.crookedGarden&&Object.values(window.crookedGarden.getState().art).every(Boolean));
  await page.clock.pauseAt(new Date('2026-10-22T12:00:02Z'));
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  const point=async(x,y)=>{
    const {view:v}=await state(),r=await page.locator('#game-root canvas').boundingBox();
    await page.mouse.move(r.x+(v.x+x*v.scale)/v.width*r.width,r.y+(v.y+y*v.scale)/v.height*r.height);
  };
  assert.equal((await state()).phase,'title');
  assert.equal(await page.locator('#hud').isVisible(),false);
  assert.equal(await page.locator('aside,footer,header').count(),0,'No website-style sidebar/header/footer');
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/title.png',fullPage:true});
  const beforeHelp=await state();
  await page.locator('#how-to-play').click();
  assert.equal((await state()).phase,'help');
  assert.equal(await page.locator('#help-title').textContent(),'HOW TO PLAY');
  assert.match(await page.locator('#help-screen').textContent(),/You do not drag the seed itself/i);
  await page.clock.runFor(1000);
  assert.equal((await state()).clock,beforeHelp.clock);assert.equal((await state()).seed,beforeHelp.seed);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'help-play','Guide traps keyboard focus');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'help-back');
  await page.screenshot({path:'artifacts/how-to-play.png',fullPage:true});
  await page.keyboard.press('Escape');
  assert.equal((await state()).phase,'title');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'how-to-play');
  await page.locator('#how-to-play').click();await page.locator('#help-play').click();
  assert.equal((await state()).phase,'playing');
  assert.equal(await page.locator('#hud').isVisible(),true);
  assert.equal(new Set((await state()).bugs.map(b=>b.kind)).size,2);
  await page.locator('#boost').click();assert.equal((await state()).queued,true);
  await page.locator('#boost').click();assert.equal((await state()).queued,false);
  await point(300,300);await page.mouse.down();await page.clock.runFor(100);
  assert.ok(635-(await state()).tip.y>=12,'Input moves the vine within 100ms');
  await page.mouse.up();const count=(await state()).points;
  await page.clock.runFor(200);assert.equal((await state()).points,count,'Release stops the vine');
  await page.keyboard.press('Space');await page.clock.runFor(100);
  assert.equal((await state()).phase,'paused');const frozen=(await state()).clock;
  await page.clock.runFor(1000);assert.equal((await state()).clock,frozen,'Pause freezes enemies too');
  const pausedState=await state();
  await page.locator('#pause-help').click();assert.equal((await state()).phase,'help');
  await page.clock.runFor(1000);assert.equal((await state()).clock,frozen,'Help never advances the run');
  await page.locator('#help-back').click();assert.equal((await state()).phase,'paused');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'pause-help');
  await page.locator('#pause-help').click();await page.locator('#help-play').click();
  assert.equal((await state()).phase,'playing');assert.equal((await state()).seed,pausedState.seed);assert.equal((await state()).points,pausedState.points);
  await page.keyboard.down('g');await page.clock.runFor(4000);await page.keyboard.up('g');
  assert.equal((await state()).phase,'result');assert.equal((await state()).status,'blocked');
  await page.locator('#result-undo').click();assert.equal((await state()).phase,'playing');
  const old=await state();await page.locator('#restart').click();
  assert.notEqual((await state()).seed,old.seed);assert.notDeepEqual((await state()).bugs,old.bugs,'Retry changes the swarm');

  async function follow(route){
    for(const [x,y] of route){
      if((await state()).phase==='result')break;
      await point(x,y);await page.mouse.down();
      for(let i=0;i<200;i++){
        const before=await state();
        if(before.cooldown<=0&&before.burst<=0&&before.water>30&&before.bugs.some(b=>!b.stunned&&Math.hypot(before.tip.x-b.x,before.tip.y-b.y)<70))await page.keyboard.press('Shift');
        await page.clock.runFor(50);const s=await state();
        if(s.phase==='result'){assert.ok(s.flowers.every(Boolean),`Garden ${s.stage+1}, seed ${s.seed} failed: ${s.endedBy}, flowers ${s.flowers}, water ${s.water}`);break;}
        if(Math.hypot(s.tip.x-x,s.tip.y-y)<10)break;
        assert.ok(i<199,'Waypoint is reachable');
      }
      await page.mouse.up();
    }
  }
  const routes=[
    [[430,550],[500,550],[500,435],[205,390],[130,390],[130,280],[345,170]],
    [[425,570],[425,455],[205,420],[205,300],[405,275],[405,160]],
    [[205,590],[205,475],[410,450],[410,335],[205,310],[205,190]]
  ];
  for(let stage=0;stage<3;stage++){
    assert.equal((await state()).stage,stage);
    if(stage===2)assert.equal(new Set((await state()).bugs.map(b=>b.kind)).size,3);
    if(stage===0){
      await follow(routes[0].slice(0,-1));
      await page.screenshot({path:'artifacts/arcade.png',fullPage:true});
      await follow(routes[0].slice(-1));
    }else await follow(routes[stage]);
    const s=await state();assert.equal(s.phase,'result');assert.ok(s.flowers.every(Boolean));
    assert.ok(s.score>=900,'Restoration adds to the run score');
    await page.screenshot({path:`artifacts/clear-${stage+1}.png`,fullPage:true});
    await page.locator('#next').click();
  }
  assert.equal((await state()).stage,0);assert.equal((await state()).score,0);assert.ok((await state()).best>0);
  await page.locator('#music').click();
  await page.waitForFunction(()=>document.querySelector('#music').getAttribute('aria-pressed')==='true');
  await page.locator('#music').click();
  assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'false');

  const sizes=[[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1440,900],[568,320],[667,375],[844,390]];
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});await page.clock.runFor(100);
    await page.waitForFunction(()=>Math.abs(window.crookedGarden.getState().view.width-innerWidth)<1);
    const layout=await page.evaluate(()=>{
      const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return {width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,canvas:rect('#game-root canvas'),controls:['#boost','#undo','#restart','#pause','#music','#flower-icons','.vitals'].map(rect)};
    });
    const label=`${width}×${height}`;
    assert.ok(layout.width<=width+1&&layout.height<=height+1,`${label}: no page scrolling`);
    assert.ok(Math.abs(layout.canvas.width-width)<1&&Math.abs(layout.canvas.height-height)<1,`${label}: game fills the viewport`);
    for(const r of layout.controls)assert.ok(r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,`${label}: HUD/action controls fit: ${JSON.stringify(r)}`);
    if([[390,844],[1280,720],[844,390]].some(([w,h])=>w===width&&h===height))await page.screenshot({path:`artifacts/game-${width}x${height}.png`,fullPage:true});
    await page.locator('#pause').click();assert.equal((await state()).phase,'paused');
    await page.locator('#pause-help').click();assert.equal((await state()).phase,'help');
    const helpLayout=await page.evaluate(()=>{
      const scroll=document.querySelector('.help-scroll');
      return {width:scroll.scrollWidth,client:scroll.clientWidth,buttons:['help-back','help-play'].map(id=>{
        const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};
      })};
    });
    assert.ok(helpLayout.width<=helpLayout.client+1,`${label}: guide has no horizontal overflow`);
    for(const r of helpLayout.buttons)assert.ok(r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,`${label}: guide navigation stays visible`);
    await page.locator('.help-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
    assert.equal(await page.locator('#help-back').isVisible(),true);
    if(width===390&&height===844)await page.screenshot({path:'artifacts/how-to-play-mobile.png',fullPage:true});
    await page.locator('#help-back').click();assert.equal((await state()).phase,'paused');
    await page.locator('#resume').click();assert.equal((await state()).phase,'playing');
  }

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});watch(mobile);await mobile.addInitScript(seedSource);
  await mobile.goto(url);await mobile.waitForFunction(()=>window.crookedGarden&&Object.values(window.crookedGarden.getState().art).every(Boolean));
  await mobile.locator('#how-to-play').tap();assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().phase),'help');
  await mobile.locator('#help-play').tap();
  await mobile.locator('#boost').tap();assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().queued),true);
  const s=await mobile.evaluate(()=>window.crookedGarden.getState()),r=await mobile.locator('#game-root canvas').boundingBox();
  const x=r.x+(s.view.x+430*s.view.scale)/s.view.width*r.width,y=r.y+(s.view.y+550*s.view.scale)/s.view.height*r.height;
  const touch=await mobile.context().newCDPSession(mobile);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await mobile.waitForFunction(()=>window.crookedGarden.getState().flowers[0]);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().phase),'playing');
  const seed=await mobile.evaluate(()=>window.crookedGarden.getState().seed);
  await mobile.locator('#pause').tap();assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().phase),'paused');
  await mobile.locator('#pause-retry').tap();assert.notEqual(await mobile.evaluate(()=>window.crookedGarden.getState().seed),seed);
  await mobile.screenshot({path:'artifacts/mobile.png',fullPage:true});
  assert.deepEqual(errors,[],'No runtime errors or missing assets');
  console.log('Browser checks passed: main/pause How to Play, guide navigation/focus/preserved runs/touch and 11 layouts, plus all three gardens, score, varied swarms, real input and assets.');
}finally{
  await browser?.close();await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));
}
