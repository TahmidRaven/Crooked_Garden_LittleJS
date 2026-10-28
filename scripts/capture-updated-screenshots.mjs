// Fresh, uncomposited screenshots using real input; no injected game state or mock scores.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';
import {waitForPage} from '../tests/wait-for-page.mjs';

const output='screenshots_updated';
await mkdir(output,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}}),browser=await chromium.launch({headless:true});
const files=[];
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  // Reproduce the tested swarm sequence, without changing any game state.
  await page.addInitScript(()=>Object.defineProperty(crypto,'getRandomValues',{value:array=>{array.fill(98);return array;}}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await waitForPage(page,()=>window.crookedGarden?.getState().phase==='title');
  const state=()=>page.evaluate(()=>window.crookedGarden.getState());
  async function capture(name){
    const size=page.viewportSize();await page.mouse.move(3,size.height-3);
    await page.screenshot({path:`${output}/${name}.png`});files.push(`${name}.png`);console.log(name);
  }
  await capture('01-title-desktop');
  await page.locator('#title-leaderboard').click();
  await waitForPage(page,()=>!document.querySelector('#leaderboard-status').textContent.toLowerCase().includes('loading'));
  await capture('10-leaderboard-desktop');await page.locator('#leaderboard-back').click();
  await page.clock.install();await page.clock.pauseAt(new Date());
  await page.locator('#how-to-play').click();
  if((await page.locator('#help-motion').textContent()).includes('Pause'))await page.locator('#help-motion').click();
  await capture('02-how-to-play-desktop');await page.locator('#help-back').click();
  await page.locator('#asset-credits').click();await capture('03-credits-desktop');await page.locator('#credits-back').click();
  await page.locator('#play').click();await page.clock.runFor(1000);await capture('04-garden-1-intro');
  async function steer(x,y,start=true){
    const current=await state(),anchor={x:960,y:690};
    if(start){await page.mouse.move(anchor.x,anchor.y);await page.mouse.down();}
    const dx=x-current.tip.x,dy=y-current.tip.y,length=Math.hypot(dx,dy)||1;
    await page.mouse.move(anchor.x+40*dx/length,anchor.y+40*dy/length);
  }
  async function follow(route){
    for(const [x,y] of route){
      if((await state()).phase==='result')break;
      await steer(x,y);
      for(let i=0;i<200;i++){
        const before=await state();await steer(x,y,false);
        if(before.cooldown<=0&&before.burst<=0&&before.water>30&&before.bugs.some(b=>!b.captured&&!b.stunned&&Math.hypot(before.tip.x-b.x,before.tip.y-b.y)<70))await page.keyboard.press('Shift');
        await page.clock.runFor(50);const after=await state();
        if(after.phase==='result'){assert.ok(after.flowers.every(Boolean),`Garden ${after.stage+1}: ${after.endedBy}`);break;}
        if(Math.hypot(after.tip.x-x,after.tip.y-y)<10)break;
        assert.ok(i<199,'Waypoint must be reachable');
      }
      await page.mouse.up();
    }
  }
  const routes=[
    [[430,550],[500,550],[500,435],[205,390],[130,390],[130,280],[345,170]],
    [[425,570],[425,455],[205,420],[205,300],[405,275],[405,160]],
    [[205,590],[205,475],[410,450],[410,335],[205,310],[205,190]]
  ];
  await follow(routes[0].slice(0,4));await capture('05-garden-1-progress');
  await page.locator('#pause').click();await capture('06-paused-desktop');await page.locator('#resume').click();
  await follow(routes[0].slice(4));assert.equal((await state()).phase,'result');await capture('07-garden-1-restored');
  await page.locator('#next').click();await follow(routes[1].slice(0,3));await capture('08-garden-2-progress');
  await follow(routes[1].slice(3));assert.equal((await state()).phase,'result');await page.locator('#next').click();
  await follow(routes[2].slice(0,3));await capture('09-garden-3-progress');
  await page.locator('#pause').click();await page.locator('#home').click();
  await page.locator('#play').click();await steer(300,300);
  for(let i=0;i<120&&(await state()).phase==='playing';i++){await steer(300,300,false);await page.clock.runFor(50);}
  await page.mouse.up();assert.equal((await state()).phase,'result');await capture('11-loss-recovery');
  await page.locator('#result-home').click();await page.setViewportSize({width:390,height:844});
  await waitForPage(page,()=>window.crookedGarden.getState().view.width===390);await page.clock.runFor(100);
  await capture('12-title-mobile');await page.locator('#how-to-play').click();await capture('13-how-to-play-mobile');
  await page.locator('#help-back').click();await page.locator('#asset-credits').click();await capture('14-credits-mobile');
  await page.locator('#credits-back').click();await page.locator('#play').click();await page.clock.runFor(1000);await capture('15-gameplay-mobile');
  await writeFile(`${output}/README.md`,`# Updated game screenshots\n\nFresh captures from the current packaged build, October 29, 2026.\n\n- Desktop: 1920 × 1080. Mobile: 390 × 844.\n- Raised forest floor, clear bottom controls, slowly scrolling dark forest, Kaph lettering and current menus.\n- Actual gameplay/screens: no composites, mockups, injected game state, mock leaderboard scores or score submissions.\n- Real pointer/Burst input; seeded randomness and controlled browser time make the captures reproducible.\n- Forest: Eder Muniz, used with credit and the original custom license. Other artists are credited in-game and in CREDITS.md.\n- Earlier promotional covers/videos in screenshots/ remain unchanged.\n- Reproduce after building: env -u NODE_OPTIONS node scripts/capture-updated-screenshots.mjs\n\n## Images\n\n${files.sort().map(f=>`- [${f}](${f})`).join('\n')}\n`);
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
