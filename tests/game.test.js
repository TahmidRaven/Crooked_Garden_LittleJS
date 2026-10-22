import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGarden,advance,rewind,hitsRock,LEVELS,bloomCount,finishGarden,DEW_WATER} from '../src/game.js';

function follow(g,route){
  for(const [x,y] of route){
    for(let f=0;f<800&&Math.hypot(g.path.at(-1).x-x,g.path.at(-1).y-y)>12&&g.status!=='won';f++){
      advance(g,{x,y});
      assert.ok(!['blocked','dry'].includes(g.status),`${g.status} at ${JSON.stringify(g.path.at(-1))}`);
      assert.ok(f<799,'Waypoint is reachable');
    }
  }
  return g;
}
const fullRoute=[[430,550],[500,550],[500,435],[205,390],[130,390],[130,280],[345,170]];

test('collision catches the vine before entering a shelf',()=>{
  const g=createGarden();g.path=[{x:200,y:510}];
  for(let i=0;i<50;i++)advance(g,{x:200,y:300});
  assert.equal(g.status,'blocked');assert.ok(g.path.at(-1).y>=506);
});
test('dew replenishes growth and rewind restores the collectible and water',()=>{
  const g=createGarden();g.path=[{x:500,y:465}];const before=g.water;
  for(let i=0;i<12;i++)advance(g,{x:500,y:400});
  assert.equal(g.collected[0],true);assert.ok(g.water>before);
  rewind(g,30);assert.equal(g.collected[0],false);assert.equal(g.water,before);
});
test('a flower is a clear, but growth continues until the player finishes',()=>{
  const g=follow(createGarden(),[[430,550]]);
  assert.equal(bloomCount(g),1);assert.equal(g.status,'growing');
  assert.equal(finishGarden(g),true);assert.equal(g.status,'won');assert.equal(g.endedBy,'finish');
  const n=g.path.length;advance(g,{x:500,y:435});assert.equal(g.path.length,n);
});
test('the empty courtyard cannot be claimed as a win',()=>{
  const g=createGarden();assert.equal(finishGarden(g),false);assert.equal(g.status,'ready');
});
test('water exhaustion without a flower fails',()=>{
  const g=createGarden();g.water=.5;
  assert.equal(advance(g,{x:300,y:500}),'dry');assert.equal(g.water,0);assert.equal(bloomCount(g),0);
});
test('water exhaustion after saving a flower preserves a partial clear',()=>{
  const g=follow(createGarden(),[[430,550]]);g.water=.5;
  assert.equal(advance(g,{x:500,y:550}),'won');assert.equal(g.water,0);
  assert.equal(bloomCount(g),1);assert.equal(g.endedBy,'water');
});
test('all three flowers are reachable with a planned dew route',()=>{
  const g=follow(createGarden(),fullRoute);
  assert.equal(g.status,'won');assert.equal(g.endedBy,'complete');
  assert.equal(bloomCount(g),3);assert.ok(g.collected.every(Boolean));assert.ok(g.water>0);
});
test('the same long route without dew cannot restore all three flowers',()=>{
  const g=createGarden();g.collected.fill(true);follow(g,fullRoute);
  assert.equal(g.status,'won');assert.ok(bloomCount(g)<3);assert.equal(g.endedBy,'water');
});
test('dew adds water only once, and flowers never grant free water',()=>{
  const g=createGarden();g.path=[{x:500,y:450}];g.heading=-Math.PI/2;
  advance(g,{x:500,y:400});const after=g.water;
  assert.ok(after>g.level.water);assert.equal(g.collected[0],true);
  advance(g,{x:500,y:400});assert.ok(g.water<after);
  assert.ok(after<=g.level.water+DEW_WATER);
  const flower=createGarden();flower.path=[{x:430,y:565}];
  advance(flower,{x:430,y:500});assert.equal(bloomCount(flower),1);assert.ok(flower.water<flower.level.water);
});
test('rewind restores flower objectives and reopens a finished route',()=>{
  const g=follow(createGarden(),[[430,550]]);finishGarden(g);rewind(g,2000);
  assert.equal(g.status,'ready');assert.equal(g.endedBy,null);assert.equal(bloomCount(g),0);
  assert.equal(g.water,g.level.water);assert.equal(finishGarden(g),false);
});
test('flowers and dew are clear of collision geometry',()=>{
  for(const l of LEVELS)for(const p of [...l.dew,...l.flowers])assert.ok(!l.rocks.some(r=>hitsRock(p,r,25)));
});
test('invalid or zero time steps do not mutate the garden',()=>{
  for(const dt of [0,-1,NaN,Infinity]){const g=createGarden(),before=structuredClone(g);assert.equal(advance(g,{x:400,y:400},dt),null);assert.deepEqual(g,before);}
});
test('rewinding a collision restores a playable vine',()=>{
  const g=createGarden();for(let i=0;i<200&&g.status!=='blocked';i++)advance(g,{x:300,y:300});
  assert.equal(g.status,'blocked');rewind(g);assert.equal(g.status,'ready');
  const n=g.path.length;advance(g,{x:425,y:550});assert.ok(g.path.length>n);
});
test('growth responds within 100ms and turns toward a new target within 100ms',()=>{
  const g=createGarden(),start={...g.path[0]};
  for(let i=0;i<6;i++)advance(g,{x:300,y:550});
  assert.ok(start.y-g.path.at(-1).y>=14,'Growth should move about 15px in 100ms');
  for(let i=0;i<6;i++)advance(g,{x:500,y:620});
  assert.ok(g.heading>-.15,'A right-angle steering change should not take half a second');
});
test('growth distance is consistent at 30, 60 and 120 updates per second',()=>{
  const distances=[30,60,120].map(rate=>{
    const g=createGarden();
    for(let i=0;i<rate/2;i++)advance(g,{x:300,y:520},1/rate);
    return g.level.start.y-g.path.at(-1).y;
  });
  for(const travelled of distances)assert.ok(Math.abs(travelled-75)<.01);
});
test('faster growth cannot tunnel through shelves during a slow update',()=>{
  const g=createGarden();g.path=[{x:200,y:509}];
  assert.equal(advance(g,{x:200,y:400},.5),'blocked');
  assert.ok(g.path.at(-1).y>=506);
});
