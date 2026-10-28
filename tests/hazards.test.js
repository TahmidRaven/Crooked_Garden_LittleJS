import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {branchSegments,renderBranchHazard} from '../src/hazards.js';
import {LEVELS} from '../src/game.js';

test('branch tiles cover each existing obstacle width without overshooting its collision rectangle',()=>{
  for(const level of LEVELS)for(const rect of level.rocks){
    const before=structuredClone(rect),parts=branchSegments(rect);
    assert.equal(parts.reduce((sum,p)=>sum+p.width,0),rect.w);
    assert.equal(parts[0].x,rect.x);assert.equal(parts.at(-1).x+parts.at(-1).width,rect.x+rect.w);
    for(const p of parts){assert.equal(p.y,rect.y);assert.equal(p.height,rect.h);assert.ok(p.width>0&&p.width<=46);}
    assert.deepEqual(rect,before);
  }
});
test('rendering crops the final source tile instead of stretching or drawing past the ledge',()=>{
  const calls=[],image={width:46,height:26};
  renderBranchHazard({fillRect(){},drawImage:(...args)=>calls.push(args)},{x:10,y:20,w:100,h:26},image);
  assert.equal(calls.length,6);assert.deepEqual(calls.at(-1),[image,0,17,8,9,102,38,8,8]);
});
test('hooks-only derivative has two documented source sprites and the approved tile dimensions',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  const file=manifest.packs.find(p=>p.name==='Platformer Art Deluxe').files.find(f=>f.path==='art/barbed-branch.png');
  assert.equal(file.sources.length,2);
  const timber=manifest.packs.find(p=>p.name==='Platformer Art Deluxe').files.find(f=>f.path==='art/timber-tiles.png');
  assert.match(timber.original,/bridge\.png.*opaque centre/,'Seamless centre crop, not rounded end caps or crossed crates');
  const bytes=await readFile(`public/assets/${file.path}`);assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[46,26]);
});

test('cropped crooked barbs meet the top and bottom timber surfaces without a central strip',()=>{
  const calls=[],image={width:46,height:26},timber={width:38,height:22};
  const core=[];
  renderBranchHazard({fillRect:(...args)=>core.push(args),drawImage:(...args)=>calls.push(args)},{x:10,y:20,w:100,h:26},image,timber);
  assert.deepEqual(core,[[10,26,100,14]],'Solid uninterrupted timber core covers all tile seams');
  assert.equal(calls.length,9);
  assert.deepEqual(calls[0],[timber,0,0,38,22,10,26,38,14]);
  assert.deepEqual(calls[2],[timber,0,0,24,22,86,26,24,14]);
  assert.deepEqual(calls[3],[image,0,0,46,10,10,20,46,8]);
  assert.deepEqual(calls[4],[image,0,17,46,9,10,38,46,8]);
});
