import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';
import {captureWaterReward} from '../src/arcade.js';
import {waitForPage} from './wait-for-page.mjs';

// Use real floating-joystick gestures, not the retired absolute-pointer aiming.
async function steer(page,x,y,start=true){
  const {tip}=await page.evaluate(()=>window.crookedGarden.getState());
  const r=await page.locator('#game-root').boundingBox(),anchor={x:r.x+r.width*.5,y:r.y+r.height*.6};
  if(start){await page.mouse.move(anchor.x,anchor.y);await page.mouse.down();}
  const dx=x-tip.x,dy=y-tip.y,length=Math.hypot(dx,dy)||1;
  await page.mouse.move(anchor.x+40*dx/length,anchor.y+40*dy/length);
}

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
let browser;
try{
  const url=`http://127.0.0.1:${server.httpServer.address().port}`;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  async function watch(p){
    await p.route('https://jzixrgkpvbypiyfnshjq.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'[{"rank":1,"name":"Global Gardener","score":8000}]'}));
    p.on('pageerror',error=>errors.push(error.message));
    p.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  }
  // Simulate the first paint before either application JS or CSS is available.
  const bare=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});await watch(bare);
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
  await watch(page);await page.addInitScript(seedSource);
  await page.addInitScript(()=>{
    window.__sfxStarts=[];
    window.__musicPlayRequests=[];
    window.__guideDraws=0;
    const drawImage=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
      if(image?.src?.endsWith('/assets/art/tutorial-hand.png'))window.__guideDraws++;
      return drawImage.call(this,image,...args);
    };
    const originalPlay=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){window.__musicPlayRequests.push(this.src);return originalPlay.apply(this,args);};
    const original=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){
      window.__sfxStarts.push({duration:this.buffer?.duration||0,hasEnergy:Boolean(this.buffer?.getChannelData(0).some(v=>Math.abs(v)>1e-5))});
      return original.apply(this,args);
    };
  });
  let releaseArt;
  const artGate=new Promise(resolve=>releaseArt=resolve);
  await page.route('**/assets/art/**',async route=>{await artGate;await route.continue();});
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-22T12:00:01Z'));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await waitForPage(page,()=>window.crookedGarden);
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
  await waitForPage(page,()=>window.crookedGarden.getState().phase==='title'&&Object.values(window.crookedGarden.getState().art).every(Boolean));
  await page.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));
  assert.equal(await page.locator('#startup-credit').isVisible(),false);
  assert.equal(await page.locator('#game').getAttribute('aria-busy'),'false');
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  const point=(x,y,start=true)=>steer(page,x,y,start);
  assert.equal((await state()).phase,'title');
  assert.ok(await page.evaluate(()=>[...document.fonts].filter(font=>font.family==='Kaph').length===2&&[...document.fonts].filter(font=>font.family==='Kaph').every(font=>font.status==='loaded')),'Local Kaph regular and italic load before the menu appears');
  assert.match(await page.locator('#play').evaluate(el=>getComputedStyle(el).fontFamily),/Kaph/);
  assert.match(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),/Kaph/,'Menus use Kaph');
  for(const selector of ['#title-screen','#play','#creator-link','#help-screen summary'])assert.match(await page.locator(selector).first().evaluate(el=>getComputedStyle(el).cursor),/tutorial-hand\.png.*3 3/,'Menus and selectable controls use the Kenney hand cursor');
  assert.doesNotMatch(await page.locator('#game-root').evaluate(el=>getComputedStyle(el).cursor),/tutorial-hand/,'Gameplay retains its steering cursor');
  assert.match(await page.locator('#play').evaluate(el=>getComputedStyle(el,'::before').borderImageSource),/simple-button-primary\.svg/,'Menus use the selected theme-tinted flat-line button');
  assert.equal(await page.locator('#play').evaluate(el=>getComputedStyle(el,'::after').animationName),'none','Menus have no constant shine');
  assert.equal(await page.locator('#title-screen .studio-brand').count(),0,'No studio banner on the main menu');
  assert.equal(await page.locator('#title-screen button').count(),4,'The main menu has only four choices');
  assert.ok((await page.locator('#title-screen').innerText()).split(/\s+/).length<15,'No marketing copy on the main menu');
  await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.id),'how-to-play');
  await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>document.activeElement.id),'play');
  assert.ok(await page.evaluate(()=>window.__musicPlayRequests.some(src=>src.endsWith('/assets/audio/ui-hover.ogg'))),'User keyboard navigation plays the hover cue');
  assert.equal(await page.locator('#hud').isVisible(),false);
  assert.equal(await page.locator('aside,footer,header').count(),0,'No website-style sidebar/header/footer');
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/title.png',fullPage:true});
  assert.equal(await page.locator('#creator-link').getAttribute('href'),'https://tahmidraven.com');
  assert.equal(await page.locator('#asset-credits').textContent(),'Credits');
  assert.equal(await page.locator('a[href*="github.com/TahmidRaven"]').count(),0,'No creator credit points to the project GitHub page');
  const beforeCredits=await state();
  await page.locator('#asset-credits').click();assert.equal((await state()).phase,'credits');
  assert.ok(await page.evaluate(()=>window.__musicPlayRequests.some(src=>src.endsWith('/assets/audio/ui-select.ogg'))),'Button selection plays the local select cue');
  assert.equal(await page.locator('#asset-credits-title').textContent(),'CREDITS');
  assert.equal(await page.locator('#asset-credits-screen .studio-brand').innerText(),'AFTER HOURS ARCADE');
  assert.match(await page.locator('#asset-credits-screen').textContent(),/Kenney/);
  assert.match(await page.locator('#asset-credits-screen').textContent(),/pebonius/);
  assert.equal(await page.locator('.credit-list a[href="https://edermunizz.itch.io/free-pixel-art-forest"]').textContent(),'Eder Muniz');
  assert.match(await page.locator('#asset-credits-screen').textContent(),/CC0/);
  assert.equal(await page.locator('#asset-credits-screen a[href="https://dan5626.itch.io/"]').count(),1,'Special thanks links to Dan5626');
  assert.doesNotMatch(await page.locator('#asset-credits-screen').innerText(),/↗/,'Credit links use real Kenney icons instead of font arrows');
  assert.match(await page.locator('#creator-link').evaluate(el=>getComputedStyle(el,'::after').backgroundImage),/link-external\.png/);
  assert.match(await page.locator('.credits-thanks').innerText(),/solo developer.*playtester/);
  assert.ok((await page.locator('#asset-credits-screen .help-scroll').innerText()).split(/\s+/).length<130,'Credits stay concise with detailed sources collapsed');
  assert.equal(await page.locator('.credit-details').getAttribute('open'),null);
  await page.locator('.credit-details summary').click();
  assert.equal(await page.locator('.credit-sources a[href$="kaph-OFL.txt"]').isVisible(),true);
  assert.equal(await page.locator('.credit-list a[href="https://ggbot.itch.io/kaph-font"]').textContent(),'Kaph · GGBotNet');
  await page.locator('.credit-details summary').click();
  await page.clock.runFor(1000);assert.equal((await state()).clock,beforeCredits.clock);assert.equal((await state()).seed,beforeCredits.seed);
  for(const file of ['kenney-platformer.txt','kenney-foliage.txt','pebonius-music.txt','kenney-furniture.txt','kenney-ui-adventure.txt']){
    const response=await page.request.get(`${url}/assets/licenses/${file}`);assert.equal(response.status(),200);assert.match(await response.text(),/CC0/);
  }
  assert.equal((await page.request.get(`${url}/assets/manifest.json`)).status(),200);
  await page.locator('#credits-back').focus();
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'credits-done');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'credits-back');
  await page.screenshot({path:'artifacts/asset-credits.png',fullPage:true});
  await page.keyboard.press('Escape');assert.equal((await state()).phase,'title');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'asset-credits');
  const beforeHelp=await state();
  await page.locator('#how-to-play').click();
  assert.equal((await state()).phase,'help');
  assert.equal(await page.locator('#help-title').textContent(),'HOW TO PLAY');
  assert.match(await page.locator('#help-screen').textContent(),/Touch or click anywhere in the garden/);
  assert.equal(await page.locator('#help-screen img').count(),4);
  await waitForPage(page,()=>[...document.querySelectorAll('#help-screen img')].every(img=>img.complete&&img.naturalWidth>0));
  assert.ok(await page.locator('#help-screen img').evaluateAll(images=>images.every(img=>img.alt.length>10)),'Guide crops have descriptive alternatives');
  assert.equal(await page.locator('#help-screen img[src$=".gif"]').count(),3);
  await page.locator('#help-motion').click();
  assert.equal(await page.locator('#help-screen img[src$=".gif"]').count(),0,'Pausing clips restores still images');
  assert.equal((await state()).phase,'help');
  await page.locator('#help-motion').click();
  assert.equal(await page.locator('#help-screen img[src$=".gif"]').count(),3);
  assert.doesNotMatch(await page.locator('#help-screen').textContent(),/75%|240|300 points/,'Keep balance maths out of the basic guide');
  assert.ok(await page.locator('#help-screen details').evaluateAll(items=>items.every(item=>!item.open)));
  assert.ok((await page.locator('#help-screen .help-scroll').innerText()).split(/\s+/).length<200,'Basic instructions should stay short');
  await page.locator('#help-screen .help-recovery summary').click();assert.notEqual(await page.locator('#help-screen .help-recovery').getAttribute('open'),null);
  await page.locator('#help-screen .help-recovery summary').click();
  await page.locator('#help-screen .help-scroll').evaluate(el=>el.scrollTop=0);
  await page.locator('#help-back').focus();
  await page.clock.runFor(1000);
  assert.equal((await state()).clock,beforeHelp.clock);assert.equal((await state()).seed,beforeHelp.seed);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'help-play','Guide traps keyboard focus');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'help-back');
  await page.screenshot({path:'artifacts/how-to-play.png',fullPage:true});
  await page.locator('.help-loop-lesson').scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/how-to-play-catch.png',fullPage:true});
  await page.locator('#help-screen .help-scroll').evaluate(el=>el.scrollTop=0);
  await page.keyboard.press('Escape');
  assert.equal((await state()).phase,'title');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'how-to-play');
  assert.equal(await page.evaluate(()=>window.__musicPlayRequests.filter(src=>src.endsWith('/assets/calm-theme.ogg')).length),0,'The menu does not autoplay music before starting');
  await page.locator('#how-to-play').click();await page.locator('#help-play').click();
  assert.equal((await state()).phase,'playing');
  assert.equal(await page.locator('#hud').isVisible(),true);
  for(const id of ['pause','boost','restart'])assert.equal(await page.locator(`#${id}`).evaluate(el=>getComputedStyle(el,'::after').animationName),'none','The simple button skin stays still');
  for(const id of ['undo','boost','restart'])assert.doesNotMatch(await page.locator(`#${id}`).textContent(),/[↶↻↯]/,'Gameplay action buttons use text, not decorative symbol glyphs');
  assert.equal(await page.locator('#undo strong').textContent(),'Rewind');
  assert.equal(await page.locator('#rewind-label').textContent(),'3');
  assert.equal(await page.locator('#boost .burst-icon img').count(),2,'Burst uses two adjacent real play-icon assets');
  assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'true','Sound defaults to enabled');
  assert.equal(await page.locator('#music').getAttribute('aria-label'),'Mute sound');
  assert.match(await page.locator('#music img').getAttribute('src'),/hud-music\.svg$/);
  assert.equal(await page.locator('#music .off-dot').count(),0,'On/off sprites replace the sound-status dot');
  assert.ok(await page.locator('button').evaluateAll(buttons=>buttons.every(button=>!/[·•]/.test(button.textContent))),'Menu and gameplay buttons have no decorative dot separators');
  assert.ok(await page.evaluate(()=>window.__musicPlayRequests.some(src=>src.endsWith('/assets/calm-theme.ogg'))),'Starting the game starts its music');
  await page.locator('#music').click();
  assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'false','Players can still mute; subsequent loss checks run muted');
  assert.match(await page.locator('#music img').getAttribute('src'),/hud-music-muted\.svg$/);
  const mutedUIRequests=await page.evaluate(()=>window.__musicPlayRequests.filter(src=>src.includes('/assets/audio/ui-')).length);
  assert.equal((await state()).art.flowerPot,true,'The real planter image must be decoded before play');
  assert.equal((await state()).art.barbedBranch,true,'Approved Kenney barbed branches load before play');
  assert.equal((await state()).art.timberTiles,true,'Timber backing tiles load before play');
  assert.equal((await state()).art.darkForest,true,'The selected licensed dark forest is decoded before play');
  await page.screenshot({path:'artifacts/start-pot.png',fullPage:true});
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
  assert.ok(await page.evaluate(()=>window.__guideDraws>0),'The waiting first garden renders the Kenney hand guide');
  await point(300,300);await page.clock.runFor(100);
  const dismissedGuideDraws=await page.evaluate(()=>window.__guideDraws);
  assert.ok(635-(await state()).tip.y>=12,'Input moves the vine within 100ms');
  await page.mouse.up();const count=(await state()).points;
  await page.clock.runFor(200);assert.equal((await state()).points,count,'Release stops the vine');
  assert.equal(await page.evaluate(()=>window.__guideDraws),dismissedGuideDraws,'The guide remains dismissed after the first drag is released');
  await page.keyboard.press('Space');await page.clock.runFor(100);
  assert.match(await page.locator('#pause img').getAttribute('src'),/hud-pause\.svg$/);
  assert.match(await page.locator('#resume img').getAttribute('src'),/hud-resume\.svg$/);
  for(const selector of ['#fullscreen','#pause']){
    await page.locator(selector).evaluate(el=>{
      const style=getComputedStyle(el);
      if(el.id==='fullscreen'&&(style.backgroundImage!=='none'||style.backgroundColor!=='rgba(0, 0, 0, 0)'||style.borderTopWidth!=='0px'))throw Error('Fullscreen must be frameless');
      if(!el.querySelector('img').complete||!el.querySelector('img').naturalWidth)throw Error('HUD icon must load');
    });
  }
  assert.equal((await state()).phase,'paused');const frozen=(await state()).clock;
  await page.clock.runFor(1000);assert.equal((await state()).clock,frozen,'Pause freezes enemies too');
  const pausedState=await state();
  await page.locator('#pause-help').click();assert.equal((await state()).phase,'help');
  await page.clock.runFor(1000);assert.equal((await state()).clock,frozen,'Help never advances the run');
  await page.locator('#help-back').click();assert.equal((await state()).phase,'paused');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'pause-help');
  await page.locator('#pause-help').click();await page.locator('#help-play').click();
  assert.equal((await state()).phase,'playing');assert.equal((await state()).seed,pausedState.seed);assert.equal((await state()).points,pausedState.points);
  await point(300,300);await page.clock.runFor(4000);await page.mouse.up();
  assert.equal((await state()).phase,'result');assert.equal((await state()).status,'blocked');
  assert.match(await page.locator('#result-undo').getAttribute('class'),/menu-primary/,'Rewind is the main recovery action');
  assert.doesNotMatch(await page.locator('#next').getAttribute('class'),/menu-primary/,'Retry is secondary while rewind is available');
  assert.equal(await page.locator('#next').evaluate(el=>getComputedStyle(el,'::before').animationName),'none','Loss choices do not pulse or shine');
  assert.equal(await page.locator('#global-best-stat').isVisible(),false,'Loss screens do not show extra leaderboard stats');
  assert.equal(await page.locator('#result-leaderboard').isVisible(),false,'No leaderboard navigation competes on a loss');
  assert.match(await page.locator('#result-undo-detail').textContent(),/3 left −100 pts/);
  assert.match(await page.locator('#result-home').evaluate(el=>getComputedStyle(el,'::before').borderImageSource),/simple-button\.svg/,'Result navigation uses the same simple button family');
  assert.equal(await page.locator('.result-footer').evaluate(el=>getComputedStyle(el).flexDirection),'column','Result navigation is one centered vertical stack');
  assert.equal(await page.locator('#result-undo').evaluate(el=>getComputedStyle(el).outlineStyle),'none','The asset border is not doubled by an outer focus frame');
  assert.equal(await page.locator('#result-undo').evaluate(el=>getComputedStyle(el).textDecorationLine),'none','Focused recovery buttons have no underline');
  assert.equal(await page.locator('#result-undo-detail').evaluate(el=>getComputedStyle(el).textDecorationLine),'none','Cost labels have no underline');
  assert.equal(await page.locator('#result-rating').isVisible(),false,'Losses do not invent a star rating');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'result-undo');
  await page.screenshot({path:'artifacts/result-actions-loss.png',fullPage:true});
  assert.equal(await page.evaluate(()=>window.__sfxStarts.length),0,'Muted losses produce no synthesized sound');
  assert.equal(await page.evaluate(()=>window.__musicPlayRequests.filter(src=>src.includes('/assets/audio/ui-')).length),mutedUIRequests,'Muted navigation/selection never starts UI clips');
  await page.locator('#result-undo').click();assert.equal((await state()).phase,'playing');
  const old=await state();await page.locator('#restart').click();
  assert.notEqual((await state()).seed,old.seed);assert.notDeepEqual((await state()).bugs,old.bugs,'Retry changes the swarm');
  assert.equal((await state()).retriesLeft,2);assert.equal((await state()).retryPenalty,300);
  assert.match(await page.locator('#state-label').textContent(),/−300 PTS/);

  async function follow(route){
    for(const [x,y] of route){
      if((await state()).phase==='result')break;
      await point(x,y);
      for(let i=0;i<200;i++){
        const before=await state();
        await point(x,y,false);
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
    assert.equal((await state()).rewindsLeft,2,'Advancing gardens preserves the run-wide rewind allowance');
    assert.equal((await state()).rewindPenalty,100,'An earlier garden’s penalty remains charged once');
    assert.equal((await state()).retriesLeft,2,'Advancing gardens does not refill the three run-wide retries');
    assert.equal((await state()).retryPenalty,300,'Retry penalties carry across gardens');
    if(stage===2)assert.equal(new Set((await state()).bugs.map(b=>b.kind)).size,3);
    if(stage===0){
      await follow(routes[0].slice(0,1));
      assert.ok((await state()).bugs.every(b=>b.stunned),'Bloom switches both bugs to their non-glowing stunned appearance');
      await page.screenshot({path:'artifacts/bugs-stunned.png',fullPage:true});
      await follow(routes[0].slice(1,-1));
      await page.screenshot({path:'artifacts/arcade.png',fullPage:true});
      await follow(routes[0].slice(-1));
    }else{
      await follow(routes[stage].slice(0,3));
      await page.screenshot({path:`artifacts/garden-${stage+1}-progress.png`,fullPage:true});
      await follow(routes[stage].slice(3));
    }
    const s=await state();assert.equal(s.phase,'result');assert.ok(s.flowers.every(Boolean));
    assert.ok(s.score>=900,'Restoration adds to the run score');
    await page.screenshot({path:`artifacts/clear-${stage+1}.png`,fullPage:true});
    await page.locator('#next').click();
  }
  assert.equal((await state()).stage,0);assert.equal((await state()).score,0);assert.ok((await state()).best>0);
  await page.locator('#music').click();
  await waitForPage(page,()=>document.querySelector('#music').getAttribute('aria-pressed')==='true');
  const audioBefore=await page.evaluate(()=>window.__sfxStarts.length);
  await point(300,300);await page.clock.runFor(1300);await page.mouse.up();
  assert.equal((await state()).phase,'result');
  const lossAudio=await page.evaluate(n=>window.__sfxStarts.slice(n),audioBefore);
  assert.equal(lossAudio.length,2,'An audible impact and defeat sting start on an unmuted hit');
  assert.ok(lossAudio.every(voice=>voice.hasEnergy&&voice.duration>0));
  assert.ok(lossAudio[1].duration>lossAudio[0].duration,'Defeat has a longer tail than the hit');
  await page.clock.runFor(500);assert.equal(await page.evaluate(()=>window.__sfxStarts.length),audioBefore+2,'The result screen does not repeat death sounds');
  await page.locator('#next').click();
  const beforeDryAudio=await page.evaluate(()=>window.__sfxStarts.length);
  for(const [x,y] of [[540,635],[540,610],[60,610]]){
    if((await state()).phase==='result')break;
    await point(x,y);
    for(let i=0;i<200;i++){
      await point(x,y,false);
      await page.clock.runFor(50);const s=await state();
      if(s.phase==='result'||Math.hypot(s.tip.x-x,s.tip.y-y)<10)break;
    }
    await page.mouse.up();
  }
  assert.equal((await state()).endedBy,'water');assert.equal((await state()).phase,'result');
  const dryAudio=await page.evaluate(n=>window.__sfxStarts.slice(n),beforeDryAudio);
  assert.equal(dryAudio.length,2);assert.ok(dryAudio.every(voice=>voice.hasEnergy));
  assert.ok(dryAudio[0].duration>lossAudio[0].duration,'Water loss uses its own dry-out cue instead of the impact');
  await page.locator('#next').click();
  await page.locator('#music').click();
  assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'false');

  const sizes=[[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1440,900],[568,320],[667,375],[844,390]];
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});await page.clock.runFor(100);
    await waitForPage(page,()=>Math.abs(window.crookedGarden.getState().view.width-innerWidth)<1);
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
    for(const id of ['play','how-to-play','title-leaderboard','asset-credits']){
      const r=await page.locator(`#${id}`).boundingBox();
      assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,`${width}×${height}: menu choice ${id} is visible`);
    }
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

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});await watch(mobile);await mobile.addInitScript(seedSource);
  await mobile.goto(url);await waitForPage(mobile,()=>window.crookedGarden?.getState().phase==='title'&&Object.values(window.crookedGarden.getState().art).every(Boolean));
  await mobile.locator('#how-to-play').tap();assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().phase),'help');
  await mobile.locator('#help-play').tap();
  await mobile.locator('#boost').tap();assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().queued),true);
  const s=await mobile.evaluate(()=>window.crookedGarden.getState());
  const x=150,y=620,dx=430-s.tip.x,dy=550-s.tip.y,length=Math.hypot(dx,dy);
  const touch=await mobile.context().newCDPSession(mobile);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+40*dx/length,y:y+40*dy/length}]});
  await waitForPage(mobile,()=>window.crookedGarden.getState().flowers[0]);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().phase),'playing');
  await mobile.screenshot({path:'artifacts/vine-mobile.png',fullPage:true});
  const seed=await mobile.evaluate(()=>window.crookedGarden.getState().seed);
  await mobile.locator('#pause').tap();assert.equal(await mobile.evaluate(()=>window.crookedGarden.getState().phase),'paused');
  await mobile.locator('#pause-retry').tap();assert.notEqual(await mobile.evaluate(()=>window.crookedGarden.getState().seed),seed);
  await mobile.screenshot({path:'artifacts/mobile.png',fullPage:true});
  const shortSplash=await browser.newPage({viewport:{width:568,height:320}});await watch(shortSplash);
  await shortSplash.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await shortSplash.clock.pauseAt(new Date('2026-10-22T12:00:01Z'));
  await shortSplash.goto(url,{waitUntil:'domcontentloaded'});await waitForPage(shortSplash,()=>window.crookedGarden);
  await shortSplash.clock.runFor(800);
  assert.equal(await shortSplash.locator('#startup-credit').isVisible(),true);
  const branding=await shortSplash.locator('#startup-credit').boundingBox();
  assert.ok(branding.y>=270&&branding.y+branding.height<=320,'Short-screen branding stays below the native logo and inside the viewport');
  await shortSplash.screenshot({path:'artifacts/littlejs-splash-landscape.png',fullPage:true});
  // A seeded encounter, but real controls: trace a lasso and capture two moving bugs.
  const capturePage=await browser.newPage({viewport:{width:1280,height:800}});await watch(capturePage);
  await capturePage.addInitScript(()=>Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(42);return array;}}));
  await capturePage.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await capturePage.goto(url);await waitForPage(capturePage,()=>window.crookedGarden?.getState().phase==='title');
  await capturePage.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));
  // Its centre is clickable throughout the intentional breathing animation.
  await capturePage.locator('#play').click({force:true});
  const captureState=()=>capturePage.evaluate(()=>window.crookedGarden.getState());
  const captureRoute=[[430,550],[500,550],[500,435],[380,435],[380,380],[360,360],[300,360],[300,435],[395,435]];
  for(const [x,y] of captureRoute){
    if((await captureState()).captures)break;
    await steer(capturePage,x,y);
    for(let i=0;i<200;i++){
      const before=await captureState();
      await steer(capturePage,x,y,false);
      if(before.cooldown<=0&&before.burst<=0&&before.bugs.some(b=>!b.captured&&!b.stunned&&Math.hypot(before.tip.x-b.x,before.tip.y-b.y)<65))await capturePage.keyboard.press('Shift');
      await capturePage.clock.runFor(50);const after=await captureState();
      assert.equal(after.phase,'playing',`Capture waypoint ${x},${y}: ${after.endedBy}, tip ${JSON.stringify(after.tip)}, water ${after.water}`);
      if(after.captures||Math.hypot(after.tip.x-x,after.tip.y-y)<8)break;
      assert.ok(i<199,'Capture waypoint is reachable');
    }
    await capturePage.mouse.up();
  }
  const caught=await captureState();
  assert.equal(caught.captures,2);assert.equal(caught.maxCombo,2);assert.equal(caught.captureScore,800);
  assert.equal(caught.lastCapture.water,captureWaterReward(2,caught.lastCapture.loopLength).total);
  assert.ok(caught.lastCapture.refund<=240);assert.ok(caught.captured.every(Boolean));assert.ok(caught.score>=1150);
  assert.match(await capturePage.locator('#state-label').textContent(),/COMBO CATCH/);
  await capturePage.screenshot({path:'artifacts/double-catch.png',fullPage:true});
  await capturePage.locator('#undo').click();
  assert.equal((await captureState()).captureScore,800);assert.ok((await captureState()).captured.every(Boolean),'Rewind cannot respawn paid captures');
  for(const [x,y] of [[205,390],[130,390],[130,280],[345,170]]){
    await steer(capturePage,x,y);
    for(let i=0;i<200;i++){
      await steer(capturePage,x,y,false);
      await capturePage.clock.runFor(50);const after=await captureState();
      if(after.phase==='result'||Math.hypot(after.tip.x-x,after.tip.y-y)<10)break;
      assert.ok(i<199,'A captured arena still has a route to the remaining flowers');
    }
    await capturePage.mouse.up();
  }
  assert.ok((await captureState()).flowers.every(Boolean),'The loop bonus funds a full first-garden clear');
  assert.equal((await captureState()).captureScore,800);assert.equal(await capturePage.locator('#result-copy').isVisible(),false,'Win screens omit explanatory paragraphs');
  await capturePage.locator('#next').click();
  assert.equal((await captureState()).captures,0);assert.ok((await captureState()).captured.every(value=>!value));
  const reducedPage=await browser.newPage({viewport:{width:960,height:720},reducedMotion:'reduce'});await watch(reducedPage);await reducedPage.addInitScript(seedSource);
  await reducedPage.clock.install({time:new Date('2026-10-22T12:00:00Z')});
  await reducedPage.goto(url);await waitForPage(reducedPage,()=>window.crookedGarden?.getState().phase==='title');
  await reducedPage.clock.pauseAt(new Date('2026-10-22T12:00:10Z'));
  await reducedPage.locator('#how-to-play').click();
  assert.equal(await reducedPage.locator('#help-screen img[src$=".gif"]').count(),0,'Reduced motion defaults to static guide illustrations');
  assert.equal(await reducedPage.locator('#help-motion').getAttribute('aria-pressed'),'false');
  await reducedPage.locator('#help-play').click();
  assert.equal(await reducedPage.locator('#boost').evaluate(el=>getComputedStyle(el,'::after').animationName),'none','Reduced motion disables the button shine');
  await steer(reducedPage,430,550);await reducedPage.clock.runFor(1300);await reducedPage.mouse.up();
  assert.equal(await reducedPage.evaluate(()=>window.crookedGarden.getState().flowers[0]),true,'Detailed vine rendering also works with reduced motion');
  await reducedPage.screenshot({path:'artifacts/vine-reduced-motion.png',fullPage:true});
  await reducedPage.locator('#pause').click();const pausedPlant=await reducedPage.evaluate(()=>window.crookedGarden.getState());
  await reducedPage.clock.runFor(500);assert.deepEqual(await reducedPage.evaluate(()=>window.crookedGarden.getState()),pausedPlant,'Repeated paused renders cannot mutate simulation state');
  assert.deepEqual(errors,[],'No runtime errors or missing assets');
  console.log('Browser checks passed: hit/defeat/dry-out audio and mute, capped loop refunds, double capture, startup, credits/guide, three gardens, touch and 11 layouts.');
}finally{
  await browser?.close();await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));
}
