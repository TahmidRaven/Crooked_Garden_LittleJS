import {setTimeout as delay} from 'node:timers/promises';

// Browser RAF/timer polling can stall forever while Playwright's clock is paused.
// Poll on Node's clock so asynchronous image/network updates remain testable.
export async function waitForPage(page,condition,timeout=30000){
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline){
    if(await page.evaluate(condition))return;
    await delay(25);
  }
  throw new Error(`Page condition timed out: ${condition.toString()}`);
}
