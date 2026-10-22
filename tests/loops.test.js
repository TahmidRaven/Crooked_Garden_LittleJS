import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findClosedLoop,pointInLoop,polygonArea,segmentIntersection} from '../src/loops.js';
import {createArcade,tickArcade,CAPTURE_WATER,CAPTURE_POINTS,COMBO_WATER,COMBO_POINTS} from '../src/arcade.js';
import {rewind,MAX_WATER} from '../src/game.js';

const nearClosure=[{x:260,y:450},{x:260,y:350},{x:350,y:350},{x:350,y:450},{x:268.2,y:450}];
function fixture(count=1){
  const g=createArcade({seed:41});g.path=structuredClone(nearClosure);g.heading=Math.PI;g.steps=g.path.length-1;g.water=400;
  g.history=g.path.slice(1).map(()=>({water:400,collected:[false,false],bloomed:[false,false,false],heading:Math.PI,captureWater:0}));
  g.enemies.forEach((bug,i)=>Object.assign(bug,{x:i<count?300+i*10:500,y:395+i*10}));g.stunned.fill(100);
  return g;
}
function close(g){return tickArcade(g,{x:245,y:450},{growing:true});}

test('a real crossing and a forgiving near-touch both close a loop',()=>{
  const crossing=[...nearClosure.slice(0,-1),{x:250,y:450}];
  const loop=findClosedLoop(crossing);assert.ok(loop);assert.ok(loop.area>8000);assert.ok(pointInLoop({x:300,y:400},loop.polygon));
  const near=[...nearClosure.slice(0,-1),{x:266,y:450}];assert.ok(findClosedLoop(near));
  assert.equal(findClosedLoop(nearClosure),null,'A gap wider than the closing radius stays open');
});
test('tiny curls, straight retracing and short paths cannot award loops',()=>{
  assert.equal(findClosedLoop([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:0,y:0}]),null);
  assert.equal(findClosedLoop([{x:0,y:0},{x:100,y:0},{x:100,y:1},{x:0,y:1},{x:0,y:0}]),null);
  assert.equal(findClosedLoop([{x:0,y:0},{x:100,y:0},{x:200,y:0},{x:0,y:0}]),null);
  assert.equal(segmentIntersection({x:0,y:0},{x:10,y:0},{x:2,y:0},{x:8,y:0}),null);
});
test('polygon containment handles winding, outside points and edge points',()=>{
  const square=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}];
  assert.equal(polygonArea(square),10000);assert.ok(pointInLoop({x:50,y:50},square));
  assert.ok(pointInLoop({x:50,y:50},[...square].reverse()));
  assert.equal(pointInLoop({x:101,y:50},square),false);assert.equal(pointInLoop({x:0,y:50},square),false);
});
test('one enclosed bug is removed and grants water and score',()=>{
  const g=fixture();assert.equal(close(g),'capture');assert.deepEqual(g.captured,[true,false]);
  assert.equal(g.captures,1);assert.equal(g.captureScore,CAPTURE_POINTS);assert.equal(g.captureWaterTotal,CAPTURE_WATER);
  assert.ok(g.water>570&&g.water<580);assert.equal(g.lastCapture.count,1);assert.equal(g.lastCapture.water,180);
  const bug={x:g.enemies[0].x,y:g.enemies[0].y};g.path=[{...bug}];g.grace=0;
  tickArcade(g,bug);assert.notEqual(g.status,'blocked');assert.deepEqual({x:g.enemies[0].x,y:g.enemies[0].y},bug);
});
test('two bugs in the same closure award an explicit combo bonus',()=>{
  const g=fixture(2);close(g);assert.deepEqual(g.captured,[true,true]);assert.equal(g.maxCombo,2);
  assert.equal(g.captureScore,2*CAPTURE_POINTS+COMBO_POINTS);assert.equal(g.captureWaterTotal,2*CAPTURE_WATER+COMBO_WATER);
  assert.equal(g.lastCapture.count,2);assert.equal(g.captureSerial,1);
});
test('outside bugs and bugs on the boundary are not captured',()=>{
  const g=fixture(0);g.enemies[0].x=260;g.enemies[0].y=400;
  close(g);assert.equal(g.captures,0);assert.equal(g.captureScore,0);assert.deepEqual(g.captured,[false,false]);
});
test('empty loops are consumed, not passive traps that catch later visitors',()=>{
  const g=fixture(0);close(g);const n=g.path.length;
  assert.ok(g.loopStart>=nearClosure.length&&g.loopStart<n);g.enemies[0].x=300;g.enemies[0].y=400;
  for(let i=0;i<20;i++)tickArcade(g,g.path.at(-1));assert.equal(g.captures,0);
});
test('closing a capture on the last drop of water rescues the attempt',()=>{
  const g=fixture();g.water=.5;
  assert.equal(close(g),'capture');assert.equal(g.status,'growing');assert.equal(g.endedBy,null);assert.ok(g.water>170);
});
test('rewards respect the water cap and track actual credit rather than the nominal reward',()=>{
  const g=fixture();g.water=MAX_WATER-1;close(g);
  assert.ok(g.water<=MAX_WATER);assert.ok(g.captureWaterTotal>0&&g.captureWaterTotal<5);
  assert.equal(g.captureWaterTotal,g.lastCapture.water);
  const credit=g.captureWaterTotal;rewind(g,1000);
  assert.ok(Math.abs(g.water-(400+credit))<.001,'Rewind must not invent the clipped part of the reward');
});
test('rewinding and replaying a capture cannot farm the same bug',()=>{
  const g=createArcade({seed:41});g.path=[{x:260,y:450}];g.heading=-Math.PI/2;
  g.enemies[0].x=300;g.enemies[0].y=400;g.enemies[1].x=500;g.enemies[1].y=400;g.stunned.fill(100);
  const route=[[260,350],[350,350],[350,450],[245,450]];
  function draw(){for(const [x,y] of route)for(let f=0;f<300&&Math.hypot(g.path.at(-1).x-x,g.path.at(-1).y-y)>5.5;f++)tickArcade(g,{x,y},{growing:true});}
  draw();assert.equal(g.captures,1);const credit=g.captureWaterTotal,score=g.captureScore;
  rewind(g,5000);assert.equal(g.water,Math.min(MAX_WATER,g.level.water+credit));assert.equal(g.captured[0],true);
  draw();assert.equal(g.captures,1);assert.equal(g.captureWaterTotal,credit);assert.equal(g.captureScore,score);
});
test('a new attempt resets captures and eligibility',()=>{
  const g=fixture();close(g);const retry=createArcade({seed:42});
  assert.deepEqual(retry.captured,[false,false]);assert.equal(retry.captureScore,0);assert.equal(retry.captures,0);
});
test('an almost-closed lasso offers a join hint without awarding anything early',()=>{
  const g=fixture();g.path.at(-1).x=280;
  close(g);assert.equal(g.captures,0);assert.equal(g.captureWaterTotal,0);
  assert.equal(g.loopHint.count,1);assert.equal(g.loopHint.join.x,260);
});
