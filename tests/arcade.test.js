import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createArcade,tickArcade,queueBurst,bugsAt,BURST_COST} from '../src/arcade.js';

test('bugs wait until the player first starts growing',()=>{
  const g=createArcade(),before=structuredClone(g);
  for(let i=0;i<60;i++)tickArcade(g,{x:300,y:500});
  assert.deepEqual(g,before);
});
test('release stops growth but bug patrols continue',()=>{
  const g=createArcade();tickArcade(g,{x:300,y:500},{growing:true});
  const points=g.path.length,before=bugsAt(g);
  for(let i=0;i<30;i++)tickArcade(g,{x:300,y:500});
  assert.equal(g.path.length,points);assert.notDeepEqual(bugsAt(g),before);
});
test('unprotected contact with a thorn bug ends the attempt',()=>{
  const g=createArcade();g.started=true;g.path=[{x:340,y:410}];
  assert.equal(tickArcade(g,{x:500,y:410}),'blocked');assert.equal(g.endedBy,'bug');
  const before=structuredClone(g);tickArcade(g,{x:500,y:410},{growing:true});assert.deepEqual(g,before);
});
test('a queued burst waits for growth and can be cancelled without a cost',()=>{
  const g=createArcade();assert.equal(queueBurst(g),true);assert.equal(g.queued,true);
  tickArcade(g,{x:300,y:500});assert.equal(g.water,580);assert.equal(g.burst,0);
  queueBurst(g);assert.equal(g.queued,false);assert.equal(g.water,580);
});
test('burst spends water, protects the tip, stuns a bug, and has a cooldown',()=>{
  const g=createArcade();g.path=[{x:340,y:410}];g.heading=0;queueBurst(g);
  assert.equal(tickArcade(g,{x:500,y:410},{growing:true}),'swat');
  assert.equal(g.status,'growing');assert.equal(g.swatted,1);assert.ok(g.stunned[0]>1);
  assert.ok(g.water<580-BURST_COST);assert.ok(g.water>580-BURST_COST-5);
  assert.ok(g.cooldown>1.9);assert.ok(g.burst>0);assert.equal(queueBurst(g),false);
});
test('burst cannot pass through a shelf',()=>{
  const g=createArcade();g.path=[{x:200,y:509}];queueBurst(g);
  for(let i=0;i<6&&g.status!=='blocked';i++)tickArcade(g,{x:200,y:400},{growing:true});
  assert.equal(g.status,'blocked');assert.notEqual(g.endedBy,'bug');
});
test('a bloom stuns both bugs and recharges the burst cooldown',()=>{
  const g=createArcade();g.path=[{x:430,y:565}];g.cooldown=1;
  assert.equal(tickArcade(g,{x:430,y:500},{growing:true}),'flower');
  assert.ok(g.stunned.every(time=>time>.7));assert.equal(g.cooldown,0);
});
test('burst is unavailable without enough water',()=>{
  const g=createArcade();g.water=BURST_COST;assert.equal(queueBurst(g),false);assert.equal(g.water,BURST_COST);
});
test('the same route fails on a bug without a burst, and wins with a timed burst',()=>{
  const route=[[430,550],[500,550],[500,435],[205,390],[130,390],[130,280],[345,170]];
  function run(useBurst){
    const g=createArcade();
    for(const [x,y] of route)for(let f=0;f<800&&Math.hypot(g.path.at(-1).x-x,g.path.at(-1).y-y)>10&&!['won','blocked','dry'].includes(g.status);f++){
      if(useBurst&&g.cooldown<=0&&g.burst<=0&&bugsAt(g).some(bug=>!bug.stunned&&Math.hypot(g.path.at(-1).x-bug.x,g.path.at(-1).y-bug.y)<65))queueBurst(g);
      tickArcade(g,{x,y},{growing:true});
    }
    return g;
  }
  const failed=run(false),won=run(true);
  assert.equal(failed.endedBy,'bug');assert.equal(won.status,'won');
  assert.deepEqual(won.bloomed,[true,true,true]);assert.ok(won.swatted>=1);assert.ok(won.water>0);
});
test('a recovery shield allows an escape without stunning bugs for free',()=>{
  const g=createArcade();g.started=true;g.path=[{x:340,y:410}];g.grace=.9;
  tickArcade(g,{x:500,y:410});assert.notEqual(g.status,'blocked');assert.equal(g.swatted,0);
});
