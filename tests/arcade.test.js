import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createArcade,tickArcade,queueBurst,bugsAt,BURST_COST} from '../src/arcade.js';

const make=seed=>createArcade({seed:seed??12345});
const step=(g,n,target=g.path.at(-1))=>{for(let i=0;i<n;i++)tickArcade(g,target);};

test('bugs wait until first growth and keep moving when the vine stops',()=>{
  const g=make(),before=structuredClone(g);step(g,60);assert.deepEqual(g,before);
  tickArcade(g,{x:300,y:500},{growing:true});const count=g.path.length,bugs=bugsAt(g);step(g,30);
  assert.equal(g.path.length,count);assert.notDeepEqual(bugsAt(g),bugs);
});
test('same seed reproduces enemy decisions; different seeds vary positions and behaviour',()=>{
  const a=make(111),b=make(111),c=make(222);
  assert.deepEqual(a,b);assert.notDeepEqual(a.enemies,c.enemies);
  a.started=b.started=true;a.grace=b.grace=100;step(a,300);step(b,300);assert.deepEqual(a,b);
  assert.equal(new Set(a.enemies.map(e=>e.kind)).size,a.enemies.length);
});
test('ordinary retries receive new seeds and new swarms',()=>{
  const a=createArcade(),b=createArcade();assert.notEqual(a.seed,b.seed);assert.notDeepEqual(a.enemies,b.enemies);
});
test('bugs stay inside their clear roaming zones across long simulations',()=>{
  for(let stage=0;stage<3;stage++){
    const g=createArcade({seed:7,stage});g.started=true;g.grace=100;
    for(let i=0;i<1200;i++){
      tickArcade(g,{x:300,y:400});
      for(const b of g.enemies){assert.ok(b.x>=b.zone.left&&b.x<=b.zone.right);assert.ok(b.y>=b.zone.top&&b.y<=b.zone.bottom);}
    }
  }
});
test('a hunter reacts to the tip rather than replaying a fixed patrol',()=>{
  const a=make(),b=make();
  for(const g of [a,b]){g.started=true;g.grace=100;Object.assign(g.enemies[0],{kind:'hunter',x:300,y:410,heading:0});}
  a.path=[{x:240,y:410}];b.path=[{x:400,y:410}];step(a,12);step(b,12);
  assert.notEqual(a.enemies[0].heading,b.enemies[0].heading);assert.notEqual(a.enemies[0].x,b.enemies[0].x);
});
test('a charger warns before a committed lunge and then rests',()=>{
  const g=make();g.started=true;g.grace=100;g.path=[{x:400,y:410}];
  Object.assign(g.enemies[0],{kind:'charger',x:300,y:410,heading:0,timer:0,state:'roam'});
  tickArcade(g,{x:400,y:410});assert.equal(g.enemies[0].state,'windup');
  const x=g.enemies[0].x;step(g,30);assert.equal(g.enemies[0].x,x);assert.equal(bugsAt(g)[0].warning,true);
  step(g,15);assert.equal(g.enemies[0].state,'dash');assert.ok(g.enemies[0].x>x);
  step(g,30);assert.equal(g.enemies[0].state,'rest');
});
test('unprotected bug contact ends an attempt and terminal states freeze',()=>{
  const g=make();g.started=true;g.path=[{x:g.enemies[0].x,y:g.enemies[0].y}];
  assert.equal(tickArcade(g,g.path[0]),'blocked');assert.equal(g.endedBy,'bug');
  const before=structuredClone(g);step(g,60);assert.deepEqual(g,before);
});
test('an armed burst waits for growth and can be cancelled without spending water',()=>{
  const g=make(),water=g.water;queueBurst(g);step(g,60);assert.equal(g.water,water);assert.equal(g.burst,0);
  queueBurst(g);assert.equal(g.queued,false);assert.equal(g.water,water);
});
test('burst costs water, stuns contact, interrupts a charge, and has a cooldown',()=>{
  const g=make(),bug=g.enemies[0];g.path=[{x:bug.x,y:bug.y}];g.heading=0;bug.state='windup';bug.timer=.5;queueBurst(g);
  assert.equal(tickArcade(g,{x:bug.x+80,y:bug.y},{growing:true}),'swat');
  assert.equal(g.status,'growing');assert.equal(g.swatted,1);assert.ok(g.stunned[0]>1);assert.equal(bug.state,'roam');
  assert.ok(g.water<g.level.water-BURST_COST&&g.water>g.level.water-BURST_COST-5);assert.ok(g.cooldown>1.9);assert.equal(queueBurst(g),false);
});
test('one bug cannot be farmed for repeated score credit',()=>{
  const g=make();g.started=true;g.path=[{x:g.enemies[0].x,y:g.enemies[0].y}];g.burst=.4;
  tickArcade(g,g.path[0]);assert.equal(g.swatted,1);
  g.stunned[0]=0;g.path=[{x:g.enemies[0].x,y:g.enemies[0].y}];tickArcade(g,g.path[0]);assert.equal(g.swatted,1);
});
test('burst cannot go through terrain or activate with insufficient water',()=>{
  const g=make();g.path=[{x:200,y:509}];queueBurst(g);
  for(let i=0;i<6&&g.status!=='blocked';i++)tickArcade(g,{x:200,y:400},{growing:true});
  assert.equal(g.status,'blocked');assert.notEqual(g.endedBy,'bug');
  const poor=make();poor.water=BURST_COST;assert.equal(queueBurst(poor),false);
});
test('flowers stun the swarm and refresh cooldowns; recovery shields allow escape',()=>{
  const g=make();g.path=[{x:430,y:565}];g.cooldown=1;
  assert.equal(tickArcade(g,{x:430,y:500},{growing:true}),'flower');assert.ok(g.stunned.every(t=>t>.7));assert.equal(g.cooldown,0);
  const saved=make();saved.started=true;saved.path=[{x:saved.enemies[0].x,y:saved.enemies[0].y}];saved.grace=.9;
  tickArcade(saved,saved.path[0]);assert.notEqual(saved.status,'blocked');assert.equal(saved.swatted,0);
});
