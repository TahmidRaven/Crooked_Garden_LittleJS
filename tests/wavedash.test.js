import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createWavedash,createRunProgress,ACHIEVEMENTS,LEADERBOARD} from '../src/wavedash.js';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fixture(overrides={}){
  const calls=[];
  const sdk=Object.fromEntries(Object.entries({
    init:()=>true,
    getOrCreateLeaderboard:()=>({success:true,data:{id:'board-id'}}),
    requestStats:()=>({success:true}),
    setAchievement:()=>true,
    uploadLeaderboardScore:()=>({success:true}),
    listLeaderboardEntries:()=>({success:true,data:[]}),
    ...overrides
  }).map(([name,handler])=>[name,function(...args){calls.push([name,...args]);return handler(...args);} ]));
  const client=createWavedash({getSDK:()=>sdk,timeoutMS:30,retryMS:2,maxTries:3});
  return {client,calls,sdk};
}

test('no SDK means no platform work or achievements, and no failed offline startup',async()=>{
  const client=createWavedash({getSDK:()=>undefined});client.init();client.init();
  client.unlock('FIRST_BLOOM');assert.equal(client.active,false);
  assert.equal(await client.postScore(123),false);assert.equal(await client.getScores(),null);client.dispose();
});
test('a broken SDK initializer cannot crash the game',()=>{
  const {client}=fixture({init:()=>{throw new Error('unavailable');}});
  assert.doesNotThrow(()=>client.init());assert.equal(client.active,false);client.dispose();
});
test('initializes only once and creates the descending numeric board',async()=>{
  const {client,calls}=fixture();client.init();client.init();await wait(0);
  assert.equal(client.active,true);
  assert.deepEqual(calls,[['init'],['getOrCreateLeaderboard',LEADERBOARD,1,0]]);client.dispose();
});
test('score submission uses the returned ID, a whole score and boolean keepBest',async()=>{
  const {client,calls}=fixture();client.init();
  assert.equal(await client.postScore(4321),true);
  assert.deepEqual(calls.at(-1),['uploadLeaderboardScore','board-id',4321,true]);
  for(const invalid of [NaN,Infinity,-1,1.5,'100',Number.MAX_SAFE_INTEGER+1])assert.equal(await client.postScore(invalid),false);
  assert.equal(calls.filter(c=>c[0]==='uploadLeaderboardScore').length,1);client.dispose();
});
test('a failed board lookup is retryable and never posts to the board name',async()=>{
  let attempts=0;
  const {client,calls}=fixture({getOrCreateLeaderboard:()=>++attempts===1?{success:false}:{success:true,data:{id:'retry-board'}}});
  client.init();await wait(0);assert.equal(await client.postScore(100),true);
  assert.deepEqual(calls.at(-1),['uploadLeaderboardScore','retry-board',100,true]);client.dispose();
});
test('service throws, rejected promises and never-settling requests are bounded',async()=>{
  for(const uploadLeaderboardScore of [()=>{throw Error('offline');},()=>Promise.reject(Error('offline')),()=>new Promise(()=>{})]){
    const {client}=fixture({uploadLeaderboardScore});client.init();assert.equal(await client.postScore(100),false);client.dispose();
  }
});
test('achievements wait for stats and retry false until accepted, without duplicates',async()=>{
  let attempts=0;
  const {client,calls}=fixture({setAchievement:()=>++attempts>=2});client.init();
  client.unlock('FIRST_BLOOM');client.unlock('FIRST_BLOOM');client.unlock('NOT_REAL');await wait(25);
  assert.equal(attempts,2);assert.deepEqual(calls.find(c=>c[0]==='setAchievement'),['setAchievement','FIRST_BLOOM',true]);
  assert.ok(calls.findIndex(c=>c[0]==='requestStats')<calls.findIndex(c=>c[0]==='setAchievement'));client.dispose();
});
test('refused achievements and failed stats stop retrying at a finite limit',async()=>{
  for(const overrides of [{setAchievement:()=>false},{requestStats:()=>({success:false})}]){
    const {client,calls}=fixture(overrides);client.init();client.unlock('BUG_GARDENER');await wait(30);
    const count=calls.length;await wait(10);assert.equal(calls.length,count);
    assert.equal(calls.filter(c=>c[0]===(overrides.setAchievement?'setAchievement':'requestStats')).length,3);client.dispose();
  }
});
test('reads ten global scores with documented field names and drops invalid records',async()=>{
  const {client,calls}=fixture({listLeaderboardEntries:()=>({success:true,data:[
    {globalRank:1,username:'<img onerror=alert(1)>',score:4000},
    {globalRank:2,score:3000},
    {globalRank:0,score:123},{globalRank:3,score:NaN}
  ]})});client.init();
  assert.deepEqual(await client.getScores(),[{rank:1,name:'<img onerror=alert(1)>',score:4000},{rank:2,name:'Gardener',score:3000}]);
  assert.deepEqual(calls.at(-1),['listLeaderboardEntries','board-id',0,10,false]);client.dispose();
});
test('failed and malformed score lists are different from an empty board',async()=>{
  for(const response of [{success:false},{success:true,data:{}},undefined]){
    const {client}=fixture({listLeaderboardEntries:()=>response});client.init();assert.equal(await client.getScores(),null);client.dispose();
  }
  const {client}=fixture();client.init();assert.deepEqual(await client.getScores(),[]);client.dispose();
});
test('disposal clears retries and disables all future writes',async()=>{
  const {client,calls}=fixture({setAchievement:()=>false});client.init();client.unlock('FIRST_BLOOM');await wait(0);client.dispose();
  const count=calls.length;await wait(20);client.unlock('DOUBLE_TROUBLE');assert.equal(await client.postScore(100),false);
  assert.equal(calls.length,count);assert.equal(client.active,false);
});
test('only sequential clears produce one completed-run score; duplicates cannot submit again',()=>{
  const run=createRunProgress();assert.equal(run.clear(2,5000),null);
  assert.equal(run.clear(0,1500),null);assert.equal(run.clear(0,1500),null);
  assert.equal(run.clear(2,5000),null);assert.equal(run.clear(1,3000),null);
  assert.equal(run.clear(2,NaN),null);assert.equal(run.clear(2,5000),5000);
  assert.equal(run.clear(2,5000),null);assert.equal(run.clear(3,5000),null);
  assert.equal(createRunProgress().clear(2,5000),null,'A fresh/abandoned run cannot reuse old clears');
});
test('portal import matches code identifiers and config has only public game identity',async()=>{
  const config=await readFile('wavedash.toml','utf8');assert.match(config,/j979mjdw9vq5vtftw9b2v6n7198gy2w7/);assert.doesNotMatch(config,/wd_[a-f0-9]{40,}/);
  const definitions=JSON.parse(await readFile('docs/wavedash-achievements.json','utf8'));
  assert.deepEqual(definitions.achievements.map(a=>a.identifier),ACHIEVEMENTS);
  assert.ok(definitions.achievements.every(a=>a.display_name&&a.description&&a.secret===false&&a.stat_requirement===null));
});
