import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureWaterReward,LOOP_REFUND_CAP,LOOP_REFUND_RATE,createArcade,tickArcade,queueBurst,bugsAt} from '../src/arcade.js';
import {findClosedLoop} from '../src/loops.js';

test('only the first garden gets extra starting water',()=>{
  assert.deepEqual([0,1,2].map(stage=>createArcade({stage,seed:1}).water),[720,760,800]);
});
test('efficient catches nearly pay for their loop',()=>{
  const reward=captureWaterReward(1,280);
  assert.equal(reward.refund,210);assert.equal(reward.total,280);
});
test('large wasteful loops remain costly and cannot grow an unlimited refund',()=>{
  const normal=captureWaterReward(1,400),huge=captureWaterReward(1,2000);
  assert.equal(normal.refund,LOOP_REFUND_CAP);assert.equal(huge.refund,LOOP_REFUND_CAP);
  assert.ok(normal.total<400);assert.ok(huge.total<2000*.2);
});
test('multi-catches refund the loop once, then add per-bug and combo rewards',()=>{
  const single=captureWaterReward(1,280),double=captureWaterReward(2,280);
  assert.equal(single.refund,double.refund);assert.equal(double.total-single.total,150);
  assert.equal(double.total,430);assert.equal(LOOP_REFUND_RATE,.75);
});
test('invalid capture inputs cannot create invalid water balances',()=>{
  for(const [count,length] of [[0,280],[-1,280],[1.5,280],[1,NaN],[1,-1],[1,Infinity]])assert.equal(captureWaterReward(count,length).total,0);
});
test('reported loop cost includes the joined stem segment regardless of point density',()=>{
  const coarse=[{x:0,y:0},{x:0,y:100},{x:100,y:100},{x:100,y:0},{x:0,y:0}];
  const dense=[];
  for(let i=1;i<coarse.length;i++){
    const a=coarse[i-1],b=coarse[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y));
    for(let j=0;j<n;j++)dense.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});
  }
  dense.push(coarse.at(-1));
  const a=findClosedLoop(coarse,0,0),b=findClosedLoop(dense,0,0);
  assert.equal(a.length,400);assert.equal(b.length,400);
});
test('a single-catch detour can clear the first garden with a small water margin',()=>{
  const g=createArcade({seed:20});assert.equal(g.water,720);
  const route=[[430,550],[500,550],[500,435],[380,435],[380,360],[300,360],[300,435],[395,435],[205,390],[130,390],[130,280],[345,170]];
  for(const [x,y] of route)for(let f=0;f<800&&Math.hypot(g.path.at(-1).x-x,g.path.at(-1).y-y)>8&&!['won','blocked','dry'].includes(g.status);f++){
    if(g.cooldown<=0&&g.burst<=0&&bugsAt(g).some(b=>!b.captured&&!b.stunned&&Math.hypot(g.path.at(-1).x-b.x,g.path.at(-1).y-b.y)<65))queueBurst(g);
    tickArcade(g,{x,y},{growing:true});
  }
  assert.equal(g.status,'won');assert.equal(g.captures,1);assert.ok(g.bloomed.every(Boolean));
  assert.ok(g.water>60&&g.water<140,'The detour should leave a little extra breathing room, not a full tank');
});
