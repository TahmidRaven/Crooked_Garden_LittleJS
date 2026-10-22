import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BUG_ART_FILES,bugFlightPose} from '../src/bug-flight.js';

const bug=(kind='wanderer')=>({kind,heading:0,state:'roam',stunned:false});

test('all behaviours use airborne insect art, with flies for hunters and bees for the others',()=>{
  assert.equal(bugFlightPose(bug('hunter'),0,0).species,'fly');
  assert.equal(bugFlightPose(bug('wanderer'),0,0).species,'bee');
  assert.equal(bugFlightPose(bug('charger'),0,0).species,'bee');
});
test('flight cycles between genuinely different wing poses and offsets different insects',()=>{
  const a=bugFlightPose(bug(),0,0),b=bugFlightPose(bug(),0,.06);
  assert.equal(a.frame,0);assert.equal(b.frame,1);assert.notEqual(a.key,b.key);
  assert.notEqual(bugFlightPose(bug(),0,.03).frame,bugFlightPose(bug(),1,.03).frame);
});
test('body scale stays fixed across frames instead of shrinking with changing wing bounds',()=>{
  for(const kind of ['hunter','wanderer','charger']){
    const a=bugFlightPose(bug(kind),0,0),b=bugFlightPose(bug(kind),0,.06);
    assert.equal(a.scale,b.scale);assert.notDeepEqual(a.anchor,b.anchor);
    assert.equal(a.offsetY,0);assert.equal(b.offsetY,0);
  }
});
test('stunned bugs stop flapping and use a matching species silhouette',()=>{
  for(const kind of ['hunter','wanderer']){
    const stunned={...bug(kind),stunned:true};
    assert.deepEqual(bugFlightPose(stunned,0,0),bugFlightPose(stunned,0,.4));
    assert.match(bugFlightPose(stunned,0,0).key,/Stunned$/);
  }
});
test('reduced motion disables decorative flapping/banking, and a frozen clock freezes the pose',()=>{
  const b={...bug(),heading:-Math.PI/4};
  assert.deepEqual(bugFlightPose(b,0,0,{reducedMotion:true}),bugFlightPose(b,0,10,{reducedMotion:true}));
  assert.equal(bugFlightPose(b,0,10,{reducedMotion:true}).tilt,0);
  assert.deepEqual(bugFlightPose(b,1,1.25),bugFlightPose(b,1,1.25));
});
test('bank and facing follow direction without mutating simulation data',()=>{
  const b=Object.freeze({...bug(),heading:-Math.PI/4}),before=JSON.stringify(b),pose=bugFlightPose(b,0,.2);
  assert.equal(pose.flip,-1);assert.ok(pose.tilt<0&&Math.abs(pose.tilt)<=.24);
  assert.equal(bugFlightPose({...b,heading:Math.PI},0,.2).flip,1);assert.equal(JSON.stringify(b),before);
  const left=bugFlightPose({...b,heading:Math.PI/2-.001},0,.2),right=bugFlightPose({...b,heading:Math.PI/2+.001},0,.2);
  assert.ok(Math.abs(left.tilt-right.tilt)<.01,'Banking must not snap when facing flips near vertical');
});
test('every flight/stun frame is credited and its body anchor lies inside the actual PNG',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  const files=new Set(manifest.packs.flatMap(pack=>pack.files.map(file=>file.path)));
  for(const file of Object.values(BUG_ART_FILES))assert.ok(files.has(`art/${file}`),file);
  for(const kind of ['hunter','wanderer']){
    const poses=[bugFlightPose(bug(kind),0,0),bugFlightPose(bug(kind),0,.06),bugFlightPose({...bug(kind),stunned:true},0,0)];
    for(const pose of poses){
      const bytes=await readFile(`public/assets/art/${BUG_ART_FILES[pose.key]}`),w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
      assert.ok(pose.anchor.x>=0&&pose.anchor.x<w&&pose.anchor.y>=0&&pose.anchor.y<h);
    }
    assert.notDeepEqual(await readFile(`public/assets/art/${BUG_ART_FILES[poses[0].key]}`),await readFile(`public/assets/art/${BUG_ART_FILES[poses[1].key]}`));
  }
});
