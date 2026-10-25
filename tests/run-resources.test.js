import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRunResources} from '../src/run-resources.js';

test('a full run gets exactly three rewinds and every use costs 100 points',()=>{
  const run=createRunResources();assert.equal(run.remaining,3);assert.equal(run.penalty,0);
  for(let used=1;used<=3;used++){
    assert.equal(run.useRewind(),true);assert.equal(run.remaining,3-used);assert.equal(run.penalty,used*100);
  }
  assert.equal(run.useRewind(),false);assert.equal(run.penalty,300);assert.equal(run.remaining,0);
});
test('penalties apply once to the cumulative run score and cannot make it negative',()=>{
  const run=createRunResources();run.useRewind();
  assert.equal(run.score(50),0);assert.equal(run.score(1500),1400);
  assert.equal(run.score(1500+1600),3000,'Advancing a garden must not double-charge earlier rewinds');
  run.useRewind();assert.equal(run.score(1500+1600+1700),4600);
  assert.equal(run.score(0),0);assert.equal(run.remaining,1,'Scoring/retrying cannot restore a resource');
});
test('a new run gets fresh resources without changing the old run',()=>{
  const old=createRunResources();old.useRewind();old.useRewind();old.useRewind();
  const fresh=createRunResources();assert.equal(fresh.remaining,3);assert.equal(fresh.penalty,0);assert.equal(old.remaining,0);
});
