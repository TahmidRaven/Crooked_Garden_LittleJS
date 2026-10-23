import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {POT_SPRITE,potPlacement} from '../src/pot.js';
import {LEVELS,WIDTH,HEIGHT} from '../src/game.js';
import {fitViewport} from '../src/view.js';

test('the planter soil anchor matches the unchanged growth root in every garden',()=>{
  for(const level of LEVELS){
    const root=Object.freeze({...level.start}),p=potPlacement(root);
    assert.equal(p.width,54,'Keep the user-selected compact size');
    assert.ok(Math.abs(p.x+POT_SPRITE.anchor.x*p.scale-root.x)<1e-9);
    assert.ok(Math.abs(p.y+POT_SPRITE.anchor.y*p.scale-root.y)<1e-9);
    assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=WIDTH&&p.y+p.height<=HEIGHT);
  }
});
test('rendered PNG dimensions match placement metadata',async()=>{
  const bytes=await readFile('public/assets/art/flower-pot.png');
  assert.equal(bytes.readUInt32BE(16),POT_SPRITE.width);assert.equal(bytes.readUInt32BE(20),POT_SPRITE.height);
  assert.ok(POT_SPRITE.anchor.x>0&&POT_SPRITE.anchor.x<POT_SPRITE.width);
  assert.ok(POT_SPRITE.anchor.y>0&&POT_SPRITE.anchor.y<POT_SPRITE.height);
});
test('Kenney source mesh/material remain unchanged and the derivative is credited as CC0',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  const pack=manifest.packs.find(p=>p.name==='Furniture Kit planter');
  assert.equal(pack.license,'CC0-1.0');assert.match(pack.modifications,/Container-only/);assert.equal(pack.sourceFiles.length,2);
  for(const file of pack.sourceFiles){
    const bytes=await readFile(file.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
  }
});
test('screen fitting keeps the rendered soil and root aligned in portrait, landscape and high DPI',()=>{
  for(const [w,h] of [[320,568],[390,844],[568,320],[844,390],[1440,900]])for(const level of LEVELS){
    const view=fitViewport(w,h,2),p=potPlacement(level.start);
    assert.ok(Math.abs(view.x+(p.x+POT_SPRITE.anchor.x*p.scale)*view.scale-(view.x+level.start.x*view.scale))<1e-8);
    assert.ok(Math.abs(view.y+(p.y+POT_SPRITE.anchor.y*p.scale)*view.scale-(view.y+level.start.y*view.scale))<1e-8);
  }
});
