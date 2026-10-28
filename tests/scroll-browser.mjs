import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
const browser=await chromium.launch({headless:true});
try{
  await mkdir('artifacts',{recursive:true});
  const url=`http://127.0.0.1:${server.httpServer.address().port}`;
  for(const touch of [false,true]){
    const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1280,height:720},hasTouch:touch,isMobile:touch});
    const page=await context.newPage();
    await page.goto(url);
    await page.waitForFunction(()=>window.crookedGarden?.getState().phase==='title');
    const cdp=touch?await context.newCDPSession(page):null;
    for(const [trigger,panel,back] of [['#how-to-play','#help-screen','#help-back'],['#asset-credits','#asset-credits-screen','#credits-back']]){
      await page.locator(trigger).click();
      const scroll=page.locator(`${panel} .help-scroll`);
      if(panel==='#asset-credits-screen')await page.locator('.credit-details summary').click();
      await scroll.evaluate(el=>el.scrollTop=0);
      const rect=await scroll.boundingBox();
      if(touch){
        const x=rect.x+rect.width*.65,y=rect.y+rect.height*.8;
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        for(let i=1;i<=16;i++){
          await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*15}]});
          await page.evaluate(()=>new Promise(requestAnimationFrame));
        }
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      }else{
        await page.mouse.move(rect.x+rect.width*.65,rect.y+rect.height*.6);
        await page.mouse.wheel(0,350);
      }
      await page.waitForFunction(selector=>document.querySelector(selector).scrollTop>50,`${panel} .help-scroll`);
      assert.ok(await scroll.evaluate(el=>el.scrollTop>50),`${panel}: real ${touch?'swipe':'wheel'} scrolls`);
      await scroll.focus();await page.keyboard.press('End');
      await page.waitForFunction(selector=>{
        const el=document.querySelector(selector);return el.scrollTop+el.clientHeight>=el.scrollHeight-2;
      },`${panel} .help-scroll`);
      const nav=await page.locator(back).boundingBox();assert.ok(nav.y>=0&&nav.y+nav.height<=page.viewportSize().height);
      const horizontalOverflow=await scroll.evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(horizontalOverflow,false);
      if(touch)await page.screenshot({path:`artifacts/${panel==='#help-screen'?'guide':'credits'}-scroll-mobile.png`});
      await page.locator(back).click();
    }
    assert.equal(await page.evaluate(()=>window.crookedGarden.getState().clock),0,'Menu swipes do not grow the vine');
    await context.close();
  }
  console.log('Native scroll checks passed: wheel, touch swipe, keyboard End, reachable content and fixed navigation in help/credits.');
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
