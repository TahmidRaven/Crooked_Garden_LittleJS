import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dragGuidePose,renderDragGuide,findGuideRoute,guideSegmentClear,createIdleGuide,IDLE_GUIDE_DELAY,pointAlongGuide} from '../src/drag-guide.js';
import {LEVELS,createGarden} from '../src/game.js';

const {start,flowers:[flower]}=LEVELS[0];
test('drag guide travels from the actual pot to the first flower and loops',()=>{
  const first=dragGuidePose(start,flower,.3),last=dragGuidePose(start,flower,2.5);
  assert.equal(first.x,start.x);assert.equal(first.y,start.y);
  assert.equal(last.x,flower.x);assert.equal(last.y,flower.y);
  assert.ok(Math.abs(dragGuidePose(start,flower,.5).x-dragGuidePose(start,flower,3.7).x)<1e-9);
  for(let t=0;t<3.2;t+=.05){
    const p=dragGuidePose(start,flower,t);assert.ok(p.alpha>=0&&p.alpha<=1);
    assert.ok(p.x>=start.x&&p.x<=flower.x);assert.ok(p.y<=start.y&&p.y>=flower.y);
  }
});

test('idle guidance returns in every garden after six seconds and dismisses on growth',()=>{
  for(let stage=0;stage<LEVELS.length;stage++){
    const g=createGarden(stage),guide=createIdleGuide(),before=structuredClone(g);
    guide.reset(g);guide.update(g,{dt:IDLE_GUIDE_DELAY-.1});assert.equal(guide.route,null);
    guide.update(g,{dt:.2});assert.ok(guide.route?.length>=2);
    assert.deepEqual(guide.route[0],g.path.at(-1));assert.deepEqual(g,before,'Guidance never modifies gameplay');
    guide.update(g,{growing:true});assert.equal(guide.route,null);
    guide.update(g,{dt:IDLE_GUIDE_DELAY+.1});assert.ok(guide.route);
  }
});
test('guidance chooses the closest uncollected dew or unrestored flower by traversable route',()=>{
  const g=createGarden();g.path=[{x:490,y:440}];
  assert.deepEqual(findGuideRoute(g).at(-1),{...g.level.dew[0]});
  g.collected[0]=true;
  assert.deepEqual(findGuideRoute(g).at(-1),{...g.level.flowers[0]});
  g.bloomed.fill(true);g.collected.fill(true);assert.equal(findGuideRoute(g),null);
});
test('guide routes around timber instead of pointing straight through it',()=>{
  const g={path:[{x:100,y:200}],level:{flowers:[{x:400,y:200}],dew:[],rocks:[{x:220,y:150,w:60,h:100}]},bloomed:[false],collected:[]};
  assert.equal(guideSegmentClear(g.path[0],g.level.flowers[0],g.level.rocks),false);
  const route=findGuideRoute(g);assert.ok(route.length>2);
  for(let i=1;i<route.length;i++)assert.ok(guideSegmentClear(route[i-1],route[i],g.level.rocks));
  assert.deepEqual(pointAlongGuide(route,0),g.path[0]);assert.deepEqual(pointAlongGuide(route,1),g.level.flowers[0]);
});
test('guidance can prefer a farther straight-line target when the nearer one requires a detour',()=>{
  const g={path:[{x:100,y:200}],level:{flowers:[{x:400,y:200}],dew:[{x:100,y:520}],rocks:[{x:220,y:80,w:60,h:400}]},bloomed:[false],collected:[false]};
  assert.deepEqual(findGuideRoute(g).at(-1),g.level.dew[0]);
});
test('rewind or objective changes invalidate an old guide before it reappears',()=>{
  const g=createGarden(),guide=createIdleGuide();guide.reset(g,{immediate:true});assert.ok(guide.route);
  g.path.push({x:310,y:630});guide.update(g);assert.equal(guide.route,null);
  guide.update(g,{dt:7});assert.deepEqual(guide.route[0],g.path.at(-1));
  g.collected[0]=true;guide.update(g);assert.equal(guide.route,null);
});
test('reduced motion keeps a static visible hand, and missing art is harmless',()=>{
  assert.deepEqual(dragGuidePose(start,flower,0,{reducedMotion:true}),dragGuidePose(start,flower,2,{reducedMotion:true}));
  assert.equal(dragGuidePose(start,flower,0,{reducedMotion:true}).alpha,1);
  assert.doesNotThrow(()=>renderDragGuide(null,null,start,flower,0));
});
