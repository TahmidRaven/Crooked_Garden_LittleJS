import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';
import {waitForPage} from './wait-for-page.mjs';

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
let browser;
try{
  browser=await chromium.launch({headless:true});
  const url=`http://127.0.0.1:${server.httpServer.address().port}`;
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  const globalCalls=[],savedRuns=new Map();let failGlobalUpload=true,failGlobalRead=false;
  await page.route('https://jzixrgkpvbypiyfnshjq.supabase.co/**',async route=>{
    const request=route.request();
    if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'}});return;}
    globalCalls.push({url:request.url(),body:request.postDataJSON(),headers:request.headers()});
    const auth=request.url().includes('/auth/'),submit=request.url().includes('/functions/');
    const payload=request.postDataJSON();
    const duplicate=submit&&savedRuns.has(payload.runId);
    if(submit&&!failGlobalUpload&&!duplicate)savedRuns.set(payload.runId,payload.score);
    const personalBest=Math.max(0,...savedRuns.values());
    const data=auth?{access_token:'test-player-token',refresh_token:'test-refresh',expires_at:9999999999}:submit?{ok:!failGlobalUpload,duplicate,personalBest}:[{rank:1,name:'Global Gardener',score:8000}];
    await route.fulfill({status:submit&&failGlobalUpload||!auth&&!submit&&failGlobalRead?503:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
  });
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().includes('supabase.co'))errors.push(`${r.status()} ${r.url()}`);});
  await page.addInitScript(()=>{
    Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(42);return array;}});
    localStorage.setItem('crooked-garden-best-v2','999999');
    window.__waveCalls=[];window.__waveFailList=false;window.__waveFailUpload=true;
    const attempts={};
    window.Wavedash={
      init(){window.__waveCalls.push(['init',window.crookedGarden.getState().phase,Object.values(window.crookedGarden.getState().art).every(Boolean)]);return true;},
      async getOrCreateLeaderboard(...args){window.__waveCalls.push(['board',...args]);return {success:true,data:{id:'garden-masters-id'}};},
      async requestStats(){window.__waveCalls.push(['stats']);return {success:true};},
      setAchievement(id,storeNow){window.__waveCalls.push(['unlock',id,storeNow]);return (attempts[id]=(attempts[id]||0)+1)>1;},
      async listLeaderboardEntries(...args){
        window.__waveCalls.push(['list',...args]);
        if(window.__waveFailList)throw Error('offline');
        return {success:true,data:[{globalRank:1,username:'<img src=x onerror=alert(1)>',score:5000},{globalRank:2,username:'Gardener',score:4000}]};
      },
      async uploadLeaderboardScore(...args){window.__waveCalls.push(['upload',...args]);return {success:!window.__waveFailUpload};}
    };
  });
  const clockStart=new Date('2026-10-25T12:00:00Z');
  await page.clock.install({time:clockStart});await page.clock.pauseAt(clockStart);
  await page.goto(url);await page.clock.runFor(3000);await waitForPage(page,()=>window.crookedGarden?.getState().phase==='title');
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  const calls=()=>page.evaluate(()=>window.__waveCalls);
  assert.deepEqual((await calls()).filter(c=>c[0]==='init'),[['init','title',true]],'SDK init waits until art/title are ready and runs once');
  assert.deepEqual((await calls()).find(c=>c[0]==='board'),['board','Garden Masters',1,0]);
  assert.equal(await page.locator('#title-leaderboard').isVisible(),true);
  await page.locator('#title-leaderboard').click();
  await waitForPage(page,()=>document.querySelectorAll('#leaderboard-entries li').length===2);
  await page.locator('#leaderboard-global').click();
  await waitForPage(page,()=>document.getElementById('leaderboard-entries').textContent.includes('Global Gardener'));
  assert.equal(globalCalls.filter(c=>c.url.includes('/auth/')).length,0,'Viewing global rankings never creates an account');
  await page.locator('#leaderboard-wavedash').click();
  await waitForPage(page,()=>document.querySelectorAll('#leaderboard-entries li').length===2);
  assert.equal((await state()).phase,'leaderboard');
  assert.equal(await page.locator('#leaderboard-entries img').count(),0,'Player names are text, never HTML');
  assert.match(await page.locator('#leaderboard-entries').textContent(),/<img src=x/);
  const frozen=(await state()).clock;await page.clock.runFor(1000);assert.equal((await state()).clock,frozen);
  await page.locator('#leaderboard-back').focus();await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'leaderboard-refresh','Leaderboard traps focus');
  await page.keyboard.press('Escape');assert.equal((await state()).phase,'title');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'title-leaderboard');
  await page.evaluate(()=>window.__waveFailList=true);await page.locator('#title-leaderboard').click();
  await waitForPage(page,()=>document.getElementById('leaderboard-status').textContent.includes('Could not load'));
  await page.evaluate(()=>window.__waveFailList=false);await page.locator('#leaderboard-refresh').click();
  await waitForPage(page,()=>document.querySelectorAll('#leaderboard-entries li').length===2);
  await mkdir('artifacts',{recursive:true});
  for(const [width,height] of [[320,568],[390,844],[568,320]]){
    await page.setViewportSize({width,height});await page.clock.runFor(50);
    for(const id of ['leaderboard-back','leaderboard-refresh']){
      const r=await page.locator(`#${id}`).boundingBox();
      assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,`${id} fits ${width}×${height}`);
    }
    await page.screenshot({path:`artifacts/wavedash-leaderboard-${width}x${height}.png`});
  }
  await page.locator('#leaderboard-back').click();await page.setViewportSize({width:1280,height:800});await page.clock.runFor(50);
  // The deliberately breathing play button never meets Playwright's stillness check.
  await page.locator('#play').click({force:true});
  async function steer(x,y,start){
    const s=await state(),dx=x-s.tip.x,dy=y-s.tip.y,length=Math.hypot(dx,dy)||1;
    if(start){await page.mouse.move(640,480);await page.mouse.down();}
    await page.mouse.move(640+40*dx/length,480+40*dy/length);
  }
  async function follow(route,stopOnCapture=false){
    for(const [x,y] of route){
      if((await state()).phase==='result')break;
      await steer(x,y,true);
      for(let i=0;i<200;i++){
        const before=await state();await steer(x,y,false);
        if(before.cooldown<=0&&before.burst<=0&&before.water>30&&before.bugs.some(b=>!b.captured&&!b.stunned&&Math.hypot(before.tip.x-b.x,before.tip.y-b.y)<65))await page.keyboard.press('Shift');
        await page.clock.runFor(50);const after=await state();
        if(after.phase==='result'){assert.ok(after.flowers.every(Boolean),`Stage ${after.stage}: ${after.endedBy}, tip ${JSON.stringify(after.tip)}`);break;}
        if(stopOnCapture&&after.captures||Math.hypot(after.tip.x-x,after.tip.y-y)<8)break;
        assert.ok(i<199,'Waypoint remains reachable with platform enabled');
      }
      await page.mouse.up();
      if(stopOnCapture&&(await state()).captures)break;
    }
  }
  await follow([[430,550],[500,550],[500,435],[380,435],[380,380],[360,360],[300,360],[300,435],[395,435]],true);
  assert.equal((await state()).maxCombo,2,'A real double catch triggers the combo achievement');
  await follow([[205,390],[130,390],[130,280],[345,170]]);
  assert.equal((await state()).phase,'result');
  assert.equal((await calls()).filter(c=>c[0]==='upload').length,0,'Partial-run clear does not upload');
  assert.equal(await page.locator('#score-status').isVisible(),false);
  for(const route of [
    [[425,570],[425,455],[205,420],[205,300],[405,275],[405,160]],
    [[205,590],[205,475],[410,450],[410,335],[205,310],[205,190]]
  ]){
    await page.locator('#next').click();await follow(route);assert.equal((await state()).phase,'result');
  }
  await page.clock.runFor(2100);
  await waitForPage(page,()=>!document.getElementById('score-retry').hidden);
  const final=await state(),uploads=(await calls()).filter(c=>c[0]==='upload');
  await waitForPage(page,()=>document.getElementById('best-label').textContent==='8000');
  assert.match(await page.locator('.result-stats').textContent(),/GLOBAL BEST/);
  assert.notEqual(await page.locator('#best-label').textContent(),'999999','Displayed best comes from Supabase, never browser storage');
  assert.equal(uploads.length,1);assert.deepEqual(uploads[0],['upload','garden-masters-id',final.score,true]);
  assert.ok(final.score<999999,'Do not upload the stored local best');
  for(const id of ['FIRST_BLOOM','BUG_GARDENER','DOUBLE_TROUBLE','THE_GARDEN_LIVES']){
    const unlocks=(await calls()).filter(c=>c[0]==='unlock'&&c[1]===id);
    assert.equal(unlocks.length,2,`${id} retries an early refusal then stops`);assert.ok(unlocks.every(c=>c[2]===true));
  }
  await page.evaluate(()=>window.__waveFailUpload=false);await page.locator('#score-retry').click();
  await waitForPage(page,()=>document.getElementById('score-status').textContent.includes('Run submitted'));
  assert.equal((await calls()).filter(c=>c[0]==='upload').length,2);assert.equal(await page.locator('#score-retry').isVisible(),false);
  await page.locator('#result-leaderboard').click();await page.locator('#leaderboard-back').click();
  assert.equal((await state()).phase,'result');assert.equal((await calls()).filter(c=>c[0]==='upload').length,2,'Reopening results does not resubmit');
  await page.screenshot({path:'artifacts/wavedash-final-result.png'});
  assert.equal(await page.locator('#global-share-panel').isVisible(),true,'Global sharing is offered only on a complete run');
  await page.locator('#global-player-name').fill('<script>');await page.locator('#global-share').click();
  await waitForPage(page,()=>document.getElementById('global-score-status').textContent.includes('3–24'));
  assert.equal(globalCalls.filter(c=>c.url.includes('/auth/')).length,0,'Invalid names never create an account');
  await page.locator('#global-player-name').fill('Raven');await page.locator('#global-share').click();
  await waitForPage(page,()=>document.getElementById('global-score-status').textContent.includes('Could not share'));
  assert.equal(globalCalls.filter(c=>c.url.includes('/auth/')).length,1);
  failGlobalUpload=false;await page.locator('#global-share').click();
  await waitForPage(page,()=>document.getElementById('global-score-status').textContent.includes('Run saved'));
  const shared=globalCalls.filter(c=>c.url.includes('/functions/'));
  assert.equal(shared.length,2);assert.equal(shared[0].body.runId,shared[1].body.runId,'Retries keep an idempotent submission ID');
  assert.equal(shared[1].body.score,final.score);assert.equal(shared[1].body.completedGardens,3);
  assert.equal(shared[1].headers.authorization,'Bearer test-player-token');
  assert.equal(await page.locator('#global-share').isDisabled(),true);
  // Play and share another full run without replacing the player's guest session.
  await page.locator('#next').click();
  assert.equal(await page.locator('#global-share-panel').isVisible(),false);
  const replayRoutes=[
    [[430,550],[500,550],[500,435],[205,390],[130,390],[130,280],[345,170]],
    [[425,570],[425,455],[205,420],[205,300],[405,275],[405,160]],
    [[205,590],[205,475],[410,450],[410,335],[205,310],[205,190]]
  ];
  for(let stage=0;stage<3;stage++){
    await follow(replayRoutes[stage]);assert.equal((await state()).phase,'result');
    if(stage<2){assert.equal(await page.locator('#global-share-panel').isVisible(),false);await page.locator('#next').click();}
  }
  assert.equal(await page.locator('#global-share').isEnabled(),true,'Every completed run gets a fresh share action');
  await page.locator('#global-share').click();
  await waitForPage(page,()=>document.getElementById('global-score-status').textContent.includes('Run saved'));
  const submissions=globalCalls.filter(c=>c.url.includes('/functions/'));
  assert.equal(submissions.length,3);assert.notEqual(submissions[2].body.runId,submissions[1].body.runId);
  assert.equal(globalCalls.filter(c=>c.url.includes('/auth/')).length,1,'Two full runs share one guest login');
  assert.equal(savedRuns.size,2,'The backend receives both runs rather than only one best');
  failGlobalRead=true;await page.locator('#result-leaderboard').click();await page.locator('#leaderboard-global').click();
  await waitForPage(page,()=>document.getElementById('leaderboard-status').textContent.includes('Could not load'));
  await page.locator('#leaderboard-back').click();
  assert.equal(await page.locator('#best-label').textContent(),'—','Network failure never falls back to an unrelated local best');
  const offline=await browser.newPage();offline.on('pageerror',e=>errors.push(e.message));
  await offline.goto(url);await waitForPage(offline,()=>window.crookedGarden?.getState().phase==='title');
  await offline.route('https://jzixrgkpvbypiyfnshjq.supabase.co/**',route=>route.fulfill({status:503,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{}'}));
  assert.equal(await offline.locator('#title-leaderboard').isVisible(),true);assert.equal(await offline.locator('#leaderboard-wavedash').isVisible(),false);
  await offline.locator('#title-leaderboard').click();await waitForPage(offline,()=>document.getElementById('leaderboard-status').textContent.includes('Could not load'));
  await offline.locator('#leaderboard-back').click();await offline.locator('#play').click({force:true});
  assert.equal(await offline.evaluate(()=>window.crookedGarden.getState().phase),'playing');
  assert.deepEqual(errors,[]);
  console.log('Platform mock checks passed: global best from Supabase, two completed runs with one guest login, run IDs/retries, achievements, layouts and offline fallback.');
}finally{
  await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));
}
