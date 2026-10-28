import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {forestCover,forestPlacement,createForestBackgroundRenderer,forestOffset,FOREST_SCROLL_SPEED} from '../src/background.js';
import {LEVELS} from '../src/game.js';
import {fitViewport} from '../src/view.js';
import {potPlacement} from '../src/pot.js';

test('forest covers desktop, portrait and landscape without gaps or distortion',()=>{
  for(const [width,height] of [[1920,1080],[390,844],[320,568],[844,390]]){
    const rect=forestCover(width,height,272,160);
    assert.ok(rect.x<=0&&rect.y<=0&&rect.x+rect.width>=width&&rect.y+rect.height>=height);
    assert.ok(Math.abs(rect.width/rect.height-272/160)<1e-9);
  }
});

test('background composes once and reuses its cache across frames and DPR changes',()=>{
  let allocations=0,compositions=0,blits=0;
  const backing={drawImage(){compositions++;},fillRect(){},createLinearGradient:()=>({addColorStop(){}})};
  const render=createForestBackgroundRenderer(()=>{allocations++;return {getContext:()=>backing};});
  const c={save(){},restore(){},drawImage(){blits++;}},image={width:272,height:160},view={width:390,height:844,dpr:2};
  for(let i=0;i<120;i++)render(c,view,image);
  assert.equal(allocations,1);assert.equal(compositions,1);assert.equal(blits,120);
  render(c,{...view,dpr:1},image);assert.equal(compositions,1,'DPR does not multiply the background-cache allocation');
  render(c,{...view,width:844,height:390},image);assert.equal(compositions,2);
  render(c,view,{...image});assert.equal(compositions,3,'Replacing artwork invalidates cached content');
});

test('missing background art falls back to a solid fill without crashing',()=>{
  let filled=false;
  createForestBackgroundRenderer()({fillRect(){filled=true;}},{width:390,height:844},null);
  assert.equal(filled,true);
});

test('raised decorative grass meets the unchanged planter base in every garden and layout',()=>{
  for(const level of LEVELS)for(const [width,height] of [[320,568],[390,844],[768,1024],[1280,720],[1920,1080],[568,320],[844,390]]){
    const before=structuredClone(level.start),view=fitViewport(width,height,2),pot=potPlacement(level.start);
    const potBottom=view.y+(pot.y+pot.height)*view.scale;
    const placement=forestPlacement(width,height,864,410,potBottom-3);
    assert.ok(Math.abs(placement.floorY-(potBottom-3))<1e-8);
    assert.ok(potBottom<height,'The planter remains inside the viewport');assert.deepEqual(level.start,before);
  }
});

test('scrolling wraps periodically and reduced motion keeps a fixed offset',()=>{
  const width=864,viewport=390,period=width/FOREST_SCROLL_SPEED;
  assert.equal(forestOffset(width,viewport,1),forestOffset(width,viewport,0)+FOREST_SCROLL_SPEED);
  assert.ok(Math.abs(forestOffset(width,viewport,0)-forestOffset(width,viewport,period))<1e-9);
  assert.equal(forestOffset(width,viewport,0,true),forestOffset(width,viewport,10000,true));
});

test('scrolling reuses its cache and its second blit fills the wrap edge without gaps',()=>{
  let compositions=0;const frames=[];
  const background={drawImage(){compositions++;},fillRect(){},createLinearGradient:()=>({addColorStop(){}})};
  const render=createForestBackgroundRenderer(()=>({getContext:()=>background}));
  const c={save(){},restore(){},drawImage:(...args)=>frames.at(-1).push(args)},image={width:864,height:410};
  for(const seconds of [0,40,100,300,1000]){
    frames.push([]);render(c,{width:500,height:300},image,{seconds});
  }
  assert.equal(compositions,1,'Time changes never recompose the forest');
  assert.ok(frames.some(calls=>calls.length===2),'A wrap frame uses a second tile');
  for(const calls of frames){
    const [,x,,width]=calls[0];assert.ok(x<=0&&x+width>0);
    if(calls.length===2){assert.equal(calls[1][1],x+width);assert.ok(calls[1][1]+calls[1][3]>=500);}
    else assert.ok(x+width>=500);
  }
});

test('active dark forest includes the custom license, source credit and open-source permission',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  const pack=manifest.packs.find(p=>p.name==='Free Pixel Art Forest');assert.ok(pack);
  assert.equal(pack.license,'LicenseRef-Eder-Muniz');assert.match(pack.author,/Eder Muniz/);
  assert.match(await readFile(`public/assets/${pack.licenseFile}`,'utf8'),/appropriate credit/);
  assert.match(await readFile(`public/assets/${pack.permissionsFile}`,'utf8'),/open source projects/);
  const png=await readFile(`public/assets/${pack.files[0].path}`);
  assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[864,410]);
});
