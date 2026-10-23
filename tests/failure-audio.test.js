import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FAILURE_SOUNDS,failureCues,createFailureAudio} from '../src/failure-audio.js';

test('bug/terrain impacts play a hit and defeat sting; water loss uses a dry-out cue',()=>{
  assert.deepEqual(failureCues('bug'),['hit','loss']);assert.deepEqual(failureCues('terrain'),['hit','loss']);
  assert.deepEqual(failureCues('water'),['dry','loss']);assert.deepEqual(failureCues('complete'),[]);
});
test('failure audio respects mute and plays no loss cue for victory',()=>{
  const played=[];class Sound{constructor(params){this.params=params;}play(){played.push(this.params);}}
  const audio=createFailureAudio(Sound);audio.play('bug');assert.equal(played.length,0);
  audio.play('complete',{muted:false});assert.equal(played.length,0);
  assert.deepEqual(audio.play('bug',{muted:false}),['hit','loss']);assert.equal(played.length,2);
});
test('sound designs are finite, distinct, and gently bounded in volume/duration',()=>{
  for(const params of Object.values(FAILURE_SOUNDS)){
    assert.ok(params.every(Number.isFinite));assert.ok(params[0]>0&&params[0]<=.3);
    assert.ok(params[3]+params[4]+params[5]+(params[16]||0)<1);
  }
  assert.notDeepEqual(FAILURE_SOUNDS.hit,FAILURE_SOUNDS.dry);
});
test('unavailable audio output cannot crash the loss screen',()=>{
  class Sound{play(){throw new Error('Audio unavailable');}}
  const audio=createFailureAudio(Sound);assert.doesNotThrow(()=>audio.play('water',{muted:false}));
});
