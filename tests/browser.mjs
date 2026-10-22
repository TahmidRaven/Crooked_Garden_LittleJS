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
  // Simulate the first paint before either application JS or CSS is available.
  const bare=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});watch(bare);
  await bare.route('**/*.css',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
  for(let refresh=0;refresh<2;refresh++){
    if(refresh)await bare.reload();else await bare.goto(url);
    const boot=await bare.evaluate(()=>({background:getComputedStyle(document.documentElement).backgroundColor,visibility:getComputedStyle(document.getElementById('game')).visibility,styled:document.documentElement.classList.contains('game-styled')}));
    assert.equal(boot.background,'rgb(7, 31, 36)');assert.equal(boot.visibility,'hidden');assert.equal(boot.styled,false);
    assert.equal(await bare.locator('#startup-credit').isVisible(),false,'Unstyled loading markup cannot flash before CSS');
  }
  await bare.close();
  // Seed the source of randomness, not game state. Retries still receive new seeds.
  const seedSource=()=>Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(97);return array;}});
  watch(page);await page.addInitScript(seedSource);
  let releaseArt;
  const artGate=new Promise(resolve=>releaseArt=resolve);
  await page.route('**/assets/art/**',async route=>{await artGate;await route.continue();});
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-22T12:00:01Z'));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.crookedGarden);
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('game-styled')),true);
  assert.equal(await page.evaluate(()=>window.crookedGarden.getState().phase),'loading');
  assert.equal(await page.locator('#title-screen').isVisible(),false,'The menu cannot cover the engine splash');
  assert.match(await page.locator('#startup-credit').textContent(),/BUILT WITH LittleJS/);
  await mkdir('artifacts',{recursive:true});
  await page.clock.runFor(800);
  await page.screenshot({path:'artifacts/littlejs-splash.png',fullPage:true});
  await page.clock.runFor(1500);
  assert.equal(await page.evaluate(()=>window.crookedGarden.getState().phase),'loading','Slow local images keep the loading screen visible after the splash');
  assert.equal(await page.locator('#startup-credit').isVisible(),true);
  assert.equal(await page.locator('#game').getAttribute('aria-busy'),'true');
  releaseArt();await page.clock.resume();
  await page.waitForFunction(()=>window.crookedGarden.getState().phase==='title'&&Object.values(window.crookedGarden.getState().art).every(Boolean));
  await page.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));
  assert.equal(await page.locator('#startup-credit').isVisible(),false);
  assert.equal(await page.locator('#game').getAttribute('aria-busy'),'false');
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
  assert.equal(await page.locator('#creator-link').getAttribute('href'),'https://tahmidraven.com');
  assert.equal(await page.locator('#asset-credits').textContent(),'Credits');
  assert.equal(await page.locator('a[href*="github.com/TahmidRaven"]').count(),0,'No creator credit points to the project GitHub page');
  const beforeCredits=await state();
  await page.locator('#asset-credits').click();assert.equal((await state()).phase,'credits');
  assert.equal(await page.locator('#asset-credits-title').textContent(),'CREDITS');
  assert.match(await page.locator('#asset-credits-screen').textContent(),/Kenney/);
  assert.match(await page.locator('#asset-credits-screen').textContent(),/pebonius/);
  assert.match(await page.locator('#asset-credits-screen').textContent(),/CC0/);
  await page.clock.runFor(1000);assert.equal((await state()).clock,beforeCredits.clock);assert.equal((await state()).seed,beforeCredits.seed);
  for(const file of ['kenney-platformer.txt','kenney-foliage.txt','pebonius-music.txt']){
    const response=await page.request.get(`${url}/assets/licenses/${file}`);assert.equal(response.status(),200);assert.match(await response.text(),/CC0/);
  }
  assert.equal((await page.request.get(`${url}/assets/manifest.json`)).status(),200);
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'credits-done');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'credits-back');
  await page.screenshot({path:'artifacts/asset-credits.png',fullPage:true});
  await page.keyboard.press('Escape');assert.equal((await state()).phase,'title');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'asset-credits');
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
  const idle=await state(),insect=idle.bugs[0],iv=idle.view;
  const wingClip={x:Math.floor(iv.x+(insect.x-30)*iv.scale),y:Math.floor(iv.y+(insect.y-27)*iv.scale),width:Math.ceil(60*iv.scale),height:Math.ceil(54*iv.scale)};
  const wingFrames=[];
  for(let frame=0;frame<3;frame++){
    await page.clock.runFor(45);wingFrames.push(await page.screenshot({path:`artifacts/bug-flight-${frame}.png`,clip:wingClip}));
  }
  assert.ok(wingFrames.some(frame=>!frame.equals(wingFrames[0])),'Airborne bugs visibly animate while waiting for first growth');
  assert.deepEqual((await state()).bugs,idle.bugs,'Wing rendering must not move or mutate idle enemies');
  assert.equal((await state()).clock,0);
  await page.screenshot({path:'artifacts/bugs-active.png',fullPage:true});
  assert.equal((await state()).queued,false,'Menu Shift+Tab must not leak into a gameplay Burst');
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
        if(before.cooldown<=0&&before.burst<=0&&before.water>30&&before.bugs.some(b=>!b.captured&&!b.stunned&&Math.hypot(before.tip.x-b.x,before.tip.y-b.y)<70))await page.keyboard.press('Shift');
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
      await follow(routes[0].slice(0,1));
      assert.ok((await state()).bugs.every(b=>b.stunned),'Bloom switches both bugs to their non-glowing stunned appearance');
      await page.screenshot({path:'artifacts/bugs-stunned.png',fullPage:true});
      await follow(routes[0].slice(1,-1));
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
      const scroll=document.querySelector('#help-screen .help-scroll');
      return {width:scroll.scrollWidth,client:scroll.clientWidth,buttons:['help-back','help-play'].map(id=>{
        const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};
      })};
    });
    assert.ok(helpLayout.width<=helpLayout.client+1,`${label}: guide has no horizontal overflow`);
    for(const r of helpLayout.buttons)assert.ok(r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,`${label}: guide navigation stays visible`);
    await page.locator('#help-screen .help-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
    assert.equal(await page.locator('#help-back').isVisible(),true);
    if(width===390&&height===844)await page.screenshot({path:'artifacts/how-to-play-mobile.png',fullPage:true});
    await page.locator('#help-back').click();assert.equal((await state()).phase,'paused');
    await page.locator('#resume').click();assert.equal((await state()).phase,'playing');
  }

  await page.locator('#pause').click();await page.locator('#home').click();
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});await page.clock.runFor(100);
    await page.locator('#title-screen').evaluate(el=>el.scrollTop=0);
    const creator=await page.locator('#creator-link').boundingBox();
    assert.ok(creator.y>=0&&creator.y+creator.height<=height+1,`${width}×${height}: creator credit is visible on the menu`);
    await page.locator('#asset-credits').click();assert.equal((await state()).phase,'credits');
    const layout=await page.evaluate(()=>{
      const scroll=document.querySelector('#asset-credits-screen .help-scroll');
      return {width:scroll.scrollWidth,client:scroll.clientWidth,buttons:['credits-back','credits-done'].map(id=>{
        const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};
      })};
    });
    assert.ok(layout.width<=layout.client+1,`${width}×${height}: credits have no horizontal overflow`);
    for(const r of layout.buttons)assert.ok(r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,`${width}×${height}: credits navigation is visible`);
    if(width===390&&height===844)await page.screenshot({path:'artifacts/asset-credits-mobile.png',fullPage:true});
    await page.locator('#credits-done').click();assert.equal((await state()).phase,'title');
  }

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});watch(mobile);await mobile.addInitScript(seedSource);
  await mobile.goto(url);await mobile.waitForFunction(()=>window.crookedGarden?.getState().phase==='title'&&Object.values(window.crookedGarden.getState().art).every(Boolean));
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
  await mobile.screenshot({path:'artifacts/vine-mobile.png',fullPage:true});
  const seed=await mobile.evaluate(()=>window.crookedGarden.getState().seed);
  await mobile.locator('#pause').tap();assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().phase),'paused');
  await mobile.locator('#pause-retry').tap();assert.notEqual(await mobile.evaluate(()=>window.crookedGarden.getState().seed),seed);
  await mobile.screenshot({path:'artifacts/mobile.png',fullPage:true});
  const shortSplash=await browser.newPage({viewport:{width:568,height:320}});watch(shortSplash);
  await shortSplash.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await shortSplash.clock.pauseAt(new Date('2026-10-22T12:00:01Z'));
  await shortSplash.goto(url,{waitUntil:'domcontentloaded'});await shortSplash.waitForFunction(()=>window.crookedGarden);
  await shortSplash.clock.runFor(800);
  assert.equal(await shortSplash.locator('#startup-credit').isVisible(),true);
  const branding=await shortSplash.locator('#startup-credit').boundingBox();
  assert.ok(branding.y>=270&&branding.y+branding.height<=320,'Short-screen branding stays below the native logo and inside the viewport');
  await shortSplash.screenshot({path:'artifacts/littlejs-splash-landscape.png',fullPage:true});
  // A seeded encounter, but real controls: trace a lasso and capture two moving bugs.
  const capturePage=await browser.newPage({viewport:{width:1280,height:800}});watch(capturePage);
  await capturePage.addInitScript(()=>Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(42);return array;}}));
  await capturePage.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await capturePage.goto(url);await capturePage.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
  await capturePage.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));
  await capturePage.locator('#play').click();
  const captureState=()=>capturePage.evaluate(()=>window.crookedGarden.getState());
  const captureRoute=[[430,550],[500,550],[500,435],[380,435],[380,360],[300,360],[300,435],[395,435]];
  for(const [x,y] of captureRoute){
    if((await captureState()).captures)break;
    const {view:v}=await captureState(),r=await capturePage.locator('#game-root canvas').boundingBox();
    await capturePage.mouse.move(r.x+(v.x+x*v.scale)/v.width*r.width,r.y+(v.y+y*v.scale)/v.height*r.height);
    await capturePage.mouse.down();
    for(let i=0;i<200;i++){
      const before=await captureState();
      if(before.cooldown<=0&&before.burst<=0&&before.bugs.some(b=>!b.captured&&!b.stunned&&Math.hypot(before.tip.x-b.x,before.tip.y-b.y)<65))await capturePage.keyboard.press('Shift');
      await capturePage.clock.runFor(50);const after=await captureState();
      assert.equal(after.phase,'playing','The capture route remains playable');
      if(after.captures||Math.hypot(after.tip.x-x,after.tip.y-y)<8)break;
      assert.ok(i<199,'Capture waypoint is reachable');
    }
    await capturePage.mouse.up();
  }
  const caught=await captureState();
  assert.equal(caught.captures,2);assert.equal(caught.maxCombo,2);assert.equal(caught.captureScore,800);
  assert.equal(caught.lastCapture.water,440);assert.ok(caught.captured.every(Boolean));assert.ok(caught.score>=1150);
  assert.match(await capturePage.locator('#state-label').textContent(),/COMBO CATCH/);
  await capturePage.screenshot({path:'artifacts/double-catch.png',fullPage:true});
  await capturePage.locator('#undo').click();
  assert.equal((await captureState()).captureScore,800);assert.ok((await captureState()).captured.every(Boolean),'Rewind cannot respawn paid captures');
  for(const [x,y] of [[205,390],[130,390],[130,280],[345,170]]){
    const {view:v}=await captureState(),r=await capturePage.locator('#game-root canvas').boundingBox();
    await capturePage.mouse.move(r.x+(v.x+x*v.scale)/v.width*r.width,r.y+(v.y+y*v.scale)/v.height*r.height);
    await capturePage.mouse.down();
    for(let i=0;i<200;i++){
      await capturePage.clock.runFor(50);const after=await captureState();
      if(after.phase==='result'||Math.hypot(after.tip.x-x,after.tip.y-y)<10)break;
      assert.ok(i<199,'A captured arena still has a route to the remaining flowers');
    }
    await capturePage.mouse.up();
  }
  assert.ok((await captureState()).flowers.every(Boolean),'The loop bonus funds a full first-garden clear');
  assert.equal((await captureState()).captureScore,800);assert.match(await capturePage.locator('#result-copy').textContent(),/2 bugs caught/);
  await capturePage.locator('#next').click();
  assert.equal((await captureState()).captures,0);assert.ok((await captureState()).captured.every(value=>!value));
  const reducedPage=await browser.newPage({viewport:{width:960,height:720},reducedMotion:'reduce'});watch(reducedPage);await reducedPage.addInitScript(seedSource);
  await reducedPage.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await reducedPage.goto(url);await reducedPage.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
  await reducedPage.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));await reducedPage.locator('#play').click();
  const reducedState=await reducedPage.evaluate(()=>window.crookedGarden.getState()),rr=await reducedPage.locator('#game-root canvas').boundingBox(),rv=reducedState.view;
  await reducedPage.mouse.move(rr.x+(rv.x+430*rv.scale)/rv.width*rr.width,rr.y+(rv.y+550*rv.scale)/rv.height*rr.height);
  await reducedPage.mouse.down();await reducedPage.clock.runFor(1300);await reducedPage.mouse.up();
  assert.equal(await reducedPage.evaluate(()=>window.crookedGarden.getState().flowers[0]),true,'Detailed vine rendering also works with reduced motion');
  await reducedPage.screenshot({path:'artifacts/vine-reduced-motion.png',fullPage:true});
  await reducedPage.locator('#pause').click();const pausedPlant=await reducedPage.evaluate(()=>window.crookedGarden.getState());
  await reducedPage.clock.runFor(500);assert.deepEqual(await reducedPage.evaluate(()=>window.crookedGarden.getState()),pausedPlant,'Repeated paused renders cannot mutate simulation state');
  assert.deepEqual(errors,[],'No runtime errors or missing assets');
  console.log('Browser checks passed: visible idle wing cycles/stable bug positions, vine/reduced motion/pause safety, double capture, startup, credits/guide, three gardens, touch and 11 layouts.');
}finally{
  await browser?.close();await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));
}
