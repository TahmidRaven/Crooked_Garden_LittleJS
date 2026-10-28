import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scoreRating} from '../src/score-rating.js';

test('stars follow the stated 50/75/100-percent global score thresholds',()=>{
  for(const [score,stars] of [[0,0],[499,0],[500,1],[749,1],[750,2],[999,2],[1000,3],[1500,3]]){
    assert.equal(scoreRating(score,1000).stars,stars);
  }
  assert.deepEqual(scoreRating(749,1000),{stars:1,percent:74,leaderScore:1000});
});
test('empty or unavailable leaderboards never fabricate a rating',()=>{
  for(const leader of [0,null,undefined,-1,NaN,Infinity,'1000'])assert.equal(scoreRating(1000,leader),null);
  for(const score of [-1,NaN,Infinity,1.5,'1000'])assert.equal(scoreRating(score,1000),null);
});
test('the benchmark uses the actual cumulative score, without projecting stage scores or claiming rank',()=>{
  assert.equal(scoreRating(1500,4624).stars,0);
  assert.equal(scoreRating(3000,4624).stars,1);
  assert.equal(scoreRating(4000,4624).stars,2);
  assert.equal(scoreRating(5000,4624).stars,3);
  assert.equal('rank' in scoreRating(5000,4624),false);
});
