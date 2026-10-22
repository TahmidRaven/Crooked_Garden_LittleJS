import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildVineGeometry,stemRadius,planLeaves,leafUnfurl,vineAppearance,resamplePath,STEM_ROOT_RADIUS,STEM_TIP_RADIUS} from '../src/vine.js';
import {closestOnSegment} from '../src/loops.js';

const straight=length=>[{x:0,y:0},{x:length,y:0}];
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value))freeze(v);}return value;}

test('visual spline preserves exact root and live-tip positions without mutating the simulation path',()=>{
  const path=freeze([{x:10,y:20},{x:50,y:20},{x:50,y:80},{x:100,y:80}]),before=JSON.stringify(path);
  const geometry=buildVineGeometry(path);
  assert.deepEqual({x:geometry.samples[0].x,y:geometry.samples[0].y},path[0]);
  assert.deepEqual({x:geometry.samples.at(-1).x,y:geometry.samples.at(-1).y},path.at(-1));
  assert.equal(JSON.stringify(path),before);
});
test('stem tapers smoothly from the root to a fine growing tip within the existing hit radius',()=>{
  const {samples,totalLength}=buildVineGeometry(straight(300));
  assert.equal(samples[0].radius,STEM_ROOT_RADIUS);assert.equal(samples.at(-1).radius,STEM_TIP_RADIUS);
  assert.ok(samples[0].radius>samples.at(-1).radius*3);
  for(let i=1;i<samples.length;i++){assert.ok(samples[i].radius<=samples[i-1].radius+1e-8);assert.ok(samples[i].radius<=5);}
  assert.equal(stemRadius(totalLength,totalLength),STEM_TIP_RADIUS);
});
test('rounding stays close to the physical stem instead of overshooting walls or loop joins',()=>{
  const path=[{x:0,y:0},{x:43,y:0},{x:43,y:57},{x:99,y:57},{x:99,y:0}];
  const {samples}=buildVineGeometry(path);let movedOffPolyline=false;
  for(const p of samples){
    const gap=Math.min(...path.slice(1).map((b,i)=>{const q=closestOnSegment(p,path[i],b);return Math.hypot(p.x-q.x,p.y-q.y);}));
    assert.ok(gap<=2.5,`Visual centerline moved ${gap}px away from physics`);if(gap>.01)movedOffPolyline=true;
  }
  assert.ok(movedOffPolyline,'Corners should actually be rounded');
});
test('empty, short, and duplicate points do not produce invalid geometry',()=>{
  for(const path of [[],[{x:4,y:5}],[{x:4,y:5},{x:4,y:5}],straight(.2),[{x:0,y:0},{x:5,y:0},{x:5,y:0},{x:10,y:0}]]){
    const geometry=buildVineGeometry(path);
    for(const p of geometry.samples)for(const key of ['x','y','d','tx','ty','nx','ny','radius'])assert.ok(Number.isFinite(p[key]),key);
  }
  assert.throws(()=>resamplePath(straight(20),0),RangeError);
});
test('leaf placements are deterministic and independent of physics point density',()=>{
  const sparse=buildVineGeometry(straight(300)),dense=buildVineGeometry(Array.from({length:301},(_,x)=>({x,y:0})));
  assert.deepEqual(planLeaves(sparse,41),planLeaves(dense,41));
  const leaves=planLeaves(sparse,41);
  assert.ok(new Set(leaves.map(p=>p.size)).size>3);assert.ok(leaves.some(p=>p.side===1)&&leaves.some(p=>p.side===-1));
  assert.notDeepEqual(leaves,planLeaves(sparse,42));
});
test('existing leaves keep their positions and appearance as the vine grows longer',()=>{
  const short=planLeaves(buildVineGeometry(straight(200)),8).filter(p=>p.d<140);
  const long=planLeaves(buildVineGeometry(straight(400)),8).filter(p=>p.d<140);
  for(let i=0;i<short.length;i++)for(const key of ['x','y','angle','size','palette','side'])assert.equal(short[i][key],long[i][key],key);
});
test('leaf unfurling is monotonic, clamped, and instant with reduced motion',()=>{
  assert.equal(leafUnfurl(-1),0);assert.equal(leafUnfurl(0),0);assert.equal(leafUnfurl(1),1);
  let last=0;for(let age=0;age<.5;age+=.01){const growth=leafUnfurl(age);assert.ok(growth>=last&&growth<=1);last=growth;}
  assert.equal(leafUnfurl(0,true),1);
});
test('appearance caches do not mutate game data and paused simulation time freezes unfurling',()=>{
  const game=freeze({path:straight(38),clock:0,seed:7}),before=JSON.stringify(game);
  const a=vineAppearance(game),b=vineAppearance(game);
  assert.deepEqual(a.leaves,b.leaves);assert.equal(JSON.stringify(game),before);
  assert.ok(a.leaves.length>0);assert.ok(a.leaves[0].unfurl<.1);
  assert.ok(vineAppearance(game,{reducedMotion:true}).leaves.every(p=>p.unfurl===1));
});
test('rewind prunes future leaves and regrowth unfurls them again without changing surviving leaves',()=>{
  const game={path:straight(400),clock:10,seed:7};vineAppearance(game);game.clock=11;vineAppearance(game);
  game.path=straight(38);const trimmed=vineAppearance(game);assert.equal(trimmed.leaves.length,1);assert.equal(trimmed.leaves[0].unfurl,1);
  game.clock=12;game.path=straight(80);const regrown=vineAppearance(game);
  assert.equal(regrown.leaves[0].unfurl,1);assert.ok(regrown.leaves[1].unfurl<.2);
  game.clock=13;assert.ok(vineAppearance(game).leaves.every(p=>p.unfurl===1));
});
