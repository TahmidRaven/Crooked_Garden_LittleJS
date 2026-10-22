import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGarden,advance,rewind,hitsRock,LEVELS} from '../src/game.js';
test('collision catches the vine before entering a shelf',()=>{const g=createGarden();g.path=[{x:200,y:510}];for(let i=0;i<50;i++)advance(g,{x:200,y:300});assert.equal(g.status,'blocked');assert.ok(g.path.at(-1).y>=506);});
test('dew replenishes growth and rewind restores the collectible and energy',()=>{const g=createGarden();g.path=[{x:425,y:465}];g.heading=-Math.PI/2;const before=g.water;for(let i=0;i<12;i++)advance(g,{x:425,y:400});assert.equal(g.collected[0],true);assert.ok(g.water>before);rewind(g,30);assert.equal(g.collected[0],false);assert.equal(g.water,before);});
test('goal wins and growth then stops',()=>{const g=createGarden();g.path=[{x:290,y:130}];for(let i=0;i<8;i++)advance(g,g.level.goal);assert.equal(g.status,'won');const n=g.path.length;advance(g,{x:400,y:400});assert.equal(g.path.length,n);});
test('empty energy stops growth',()=>{const g=createGarden();g.water=.5;assert.equal(advance(g,{x:300,y:500}),'dry');assert.equal(g.water,0);});
test('all levels have reachable waypoint routes under the actual turning model',()=>{
 const routes=[[[425,550],[425,420],[205,380],[205,270],[345,170],[290,95]],[[425,570],[425,455],[205,420],[205,300],[405,275],[405,160],[390,90]],[[205,590],[205,475],[410,450],[410,335],[205,310],[205,190],[275,90]]];
 routes.forEach((route,index)=>{const g=createGarden(index);for(const [x,y] of route){for(let f=0;f<800&&Math.hypot(g.path.at(-1).x-x,g.path.at(-1).y-y)>12&&g.status!=='won';f++){advance(g,{x,y});assert.ok(!['blocked','dry'].includes(g.status),`Level ${index+1}: ${g.status} at ${JSON.stringify(g.path.at(-1))}`);}}assert.equal(g.status,'won');});
});
test('all pickups and goals are clear of collision geometry',()=>{for(const l of LEVELS)for(const p of [...l.dew,l.goal])assert.ok(!l.rocks.some(r=>hitsRock(p,r,24)));});
test('invalid or zero time steps do not mutate the garden',()=>{for(const dt of [0,-1,NaN,Infinity]){const g=createGarden();const before=structuredClone(g);assert.equal(advance(g,{x:400,y:400},dt),null);assert.deepEqual(g,before);}});
test('rewinding a collision restores a playable vine',()=>{const g=createGarden();for(let i=0;i<200&&g.status!=='blocked';i++)advance(g,{x:300,y:300});assert.equal(g.status,'blocked');rewind(g);assert.equal(g.status,'ready');const n=g.path.length;advance(g,{x:425,y:550});assert.equal(g.path.length,n+1);});
