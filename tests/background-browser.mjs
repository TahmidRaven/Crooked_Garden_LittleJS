import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {preview} from 'vite';
import {waitForPage} from './wait-for-page.mjs';
import {LEVELS} from '../src/game.js';
import {potPlacement} from '../src/pot.js';

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
const browser=await chromium.launch({headless:true});
try{
  for(const reducedMotion of ['no-preference','reduce']){
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion});
    await page.addInitScript(()=>{
      window.__forestOffset=null;
      window.__forestPlacement=null;
      const draw=CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
        if(image?.src?.endsWith('/dark-forest.png')&&args.length===4)window.__forestPlacement={y:args[1],height:args[3]};
        if(image instanceof HTMLCanvasElement&&image.height===innerHeight&&image.width>=innerWidth&&args[0]<=0){window.__forestOffset=args[0];window.__forestCache=image;}
        return draw.call(this,image,...args);
      };
    });
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
    await waitForPage(page,()=>window.crookedGarden?.getState().phase==='title');
    await page.clock.install();await page.clock.pauseAt(new Date());
    await page.locator('#play').click();await page.clock.runFor(100);
    const initial=await page.evaluate(()=>({offset:window.__forestOffset,state:window.crookedGarden.getState()}));
    assert.notEqual(initial.offset,null);
    await page.clock.runFor(1000);
    const later=await page.evaluate(()=>({offset:window.__forestOffset,state:window.crookedGarden.getState()}));
    if(reducedMotion==='reduce')assert.equal(later.offset,initial.offset,'Reduced motion keeps the forest static');
    else assert.ok(initial.offset-later.offset>4&&initial.offset-later.offset<8,'The forest drifts at about 6 CSS px/sec');
    assert.deepEqual(later.state.tip,initial.state.tip);assert.equal(later.state.water,initial.state.water);
    await page.locator('#pause').click();await page.clock.runFor(50);
    const paused=await page.evaluate(()=>window.__forestOffset);
    await page.clock.runFor(1000);assert.equal(await page.evaluate(()=>window.__forestOffset),paused,'Pause freezes forest motion');
    if(reducedMotion==='no-preference'){
      await page.locator('#resume').click();
      for(const [width,height] of [[320,568],[390,844],[768,1024],[1280,720],[1920,1080],[568,320],[844,390]]){
        await page.setViewportSize({width,height});
        await waitForPage(page,()=>window.crookedGarden.getState().view.width===innerWidth);
        await page.clock.runFor(100);
        const layout=await page.evaluate(()=>{
          const state=window.crookedGarden.getState(),floor=window.__forestPlacement,cache=window.__forestCache;
          const end=Math.round(floor.y+floor.height),ctx=cache.getContext('2d');
          let seamDelta=0;
          if(end>2&&end<cache.height-2){
            const a=ctx.getImageData(Math.floor(cache.width/2),end-2,1,1).data,b=ctx.getImageData(Math.floor(cache.width/2),end+2,1,1).data;
            seamDelta=Math.max(...[0,1,2].map(i=>Math.abs(a[i]-b[i])));
          }
          return {state,seamDelta,floorY:floor.y+floor.height*377/410,controls:['boost','undo','restart'].map(id=>{
            const el=document.getElementById(id),r=el.getBoundingClientRect();
            return {id,top:r.top,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')?.id};
          })};
        });
        const pot=potPlacement(LEVELS[layout.state.stage].start),view=layout.state.view;
        assert.ok(Math.abs(layout.floorY-(view.y+(pot.y+pot.height)*view.scale-3))<1,'Grass baseline meets the unchanged pot');
        assert.deepEqual(layout.state.tip,LEVELS[layout.state.stage].start,'Raising scenery never moves the vine start');
        assert.ok(layout.seamDelta<=2,'The extended dark floor has no colour seam behind the controls');
        for(const control of layout.controls)assert.equal(control.hit,control.id,'Bottom/side HUD remains unobstructed');
        if(width<=height)assert.ok(layout.floorY<Math.min(...layout.controls.map(r=>r.top))-8,'A dark gap separates the grass floor from the bottom buttons');
      }
    }
    await page.close();
  }
  console.log('Background checks passed: raised floor/pot alignment, clear HUD across seven layouts, auto-scroll, pause and reduced motion.');
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
