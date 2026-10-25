import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGlobalLeaderboard,SUPABASE_PUBLISHABLE_KEY} from '../src/global-leaderboard.js';
import {validateSubmission} from '../supabase/functions/submit-garden-score/rules.js';
import {createSubmitHandler} from '../supabase/functions/submit-garden-score/handler.js';

const run={runId:'12345678-1234-4234-8234-123456789abc',score:5628,completedGardens:3,durationSeconds:34};
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
function memory(){const entries=new Map();return {getItem:key=>entries.get(key)||null,setItem:(key,value)=>entries.set(key,value),removeItem:key=>entries.delete(key),entries};}
function fixture(handler){
  const calls=[],store=memory();
  const client=createGlobalLeaderboard({storage:()=>store,now:()=>1000000,fetcher:async(url,options)=>{
    calls.push({url,...options,body:JSON.parse(options.body)});
    return handler?handler(url,options):url.includes('/auth/')?response({access_token:'player-token',refresh_token:'refresh-token',expires_at:4600}):response({ok:true});
  }});
  return {client,calls,store};
}
test('public leaderboard reads do not sign up players, and publishable keys are not bearer tokens',async()=>{
  const {client,calls}=fixture(()=>response([{rank:1,name:'Gardener',score:5000},{rank:0,name:'bad',score:1}]));
  assert.deepEqual(await client.getScores(),[{rank:1,name:'Gardener',score:5000}]);
  assert.equal(calls.length,1);assert.match(calls[0].url,/rpc\/garden_top_scores$/);
  assert.equal(calls[0].headers.apikey,SUPABASE_PUBLISHABLE_KEY);assert.equal(calls[0].headers.Authorization,undefined);
});
test('guest identity is created lazily on sharing, reused and stored; no direct table writes',async()=>{
  const {client,calls,store}=fixture();assert.equal(calls.length,0);
  assert.equal((await client.postScore(run,' Raven ')).ok,true);
  assert.match(calls[0].url,/auth\/v1\/signup$/);
  assert.match(calls[1].url,/functions\/v1\/submit-garden-score$/);
  assert.equal(calls[1].headers.Authorization,'Bearer player-token');assert.equal(calls[1].body.name,'Raven');
  assert.equal(client.getName(),'Raven');assert.ok(store.entries.size>=2);
  await client.postScore(run,'Raven');assert.equal(calls.filter(c=>c.url.includes('/auth/')).length,1);
});
test('invalid names, scores and incomplete runs never create users or send scores',async()=>{
  const {client,calls}=fixture();
  for(const [payload,name] of [[run,'<script>'],[run,'ab'],[{...run,completedGardens:2},'Raven'],[{...run,score:10001},'Raven'],[{...run,durationSeconds:1},'Raven']])assert.equal((await client.postScore(payload,name)).ok,false);
  assert.equal(calls.length,0);
});
test('refreshes an expired guest session instead of creating another account',async()=>{
  const store=memory();store.setItem('crooked-garden-global-session-v1',JSON.stringify({access_token:'old',refresh_token:'refresh',expires_at:1}));
  const calls=[];
  const client=createGlobalLeaderboard({storage:()=>store,now:()=>1000000,fetcher:async(url,options)=>{
    calls.push([url,JSON.parse(options.body)]);
    return response(url.includes('/auth/')?{access_token:'renewed',refresh_token:'refresh-2',expires_in:3600}:{ok:true});
  }});
  assert.equal((await client.postScore(run,'Raven')).ok,true);
  assert.match(calls[0][0],/token\?grant_type=refresh_token$/);assert.deepEqual(calls[0][1],{refresh_token:'refresh'});
});
test('auth rejection, unavailable storage and network errors do not throw',async()=>{
  const {client,calls}=fixture(()=>response({error:'disabled'},403));
  assert.equal((await client.postScore(run,'Raven')).ok,false);assert.equal(calls.length,1);
  const broken=createGlobalLeaderboard({storage:()=>{throw Error('blocked');},fetcher:async()=>{throw Error('offline');}});
  assert.equal(await broken.getScores(),null);assert.equal((await broken.postScore(run,'Raven')).ok,false);
});
test('disabled anonymous provider and CAPTCHA setup failures are not mislabeled as network errors',async()=>{
  for(const [code,text] of [['anonymous_provider_disabled',/disabled.*Supabase/],['captcha_failed',/CAPTCHA/]]){
    const {client,calls}=fixture(()=>response({error_code:code,msg:'backend diagnostic'},422));
    const result=await client.postScore(run,'Raven');
    assert.equal(result.ok,false);assert.match(result.message,text);assert.doesNotMatch(result.message,/Check your connection/);
    assert.deepEqual(calls[0].body,{data:{}});assert.equal(calls.length,1,'A failed login never attempts score submission');
  }
});
test('rate limits have a retry message and never save a name as if successful',async()=>{
  const {client}=fixture(url=>url.includes('/auth/')?response({access_token:'token',refresh_token:'refresh',expires_at:4600}):response({error:'rate_limited'},429));
  const result=await client.postScore(run,'Raven');assert.equal(result.ok,false);assert.match(result.message,/5 seconds/);assert.equal(client.getName(),'Gardener');
});
test('server rules reject malicious and implausible input, ignoring supplied user IDs',()=>{
  assert.deepEqual(validateSubmission({...run,name:' Raven ',userId:'attacker'}),{name:'Raven',score:5628,runId:run.runId,durationSeconds:34});
  for(const body of [null,[],{...run,name:'<img>'},{...run,name:'a'.repeat(25)},{...run,name:'Raven',score:NaN},{...run,name:'Raven',score:10001},{...run,name:'Raven',completedGardens:2},{...run,name:'Raven',durationSeconds:9},{...run,name:'Raven',runId:'not-uuid'}])assert.equal(validateSubmission(body),null);
});
function edgeFixture(handler){
  const calls=[];
  const handle=createSubmitHandler({url:'https://example.supabase.co',key:'server-only-test-secret',
    fetcher:async(url,options)=>{calls.push({url,...options});return handler?handler(url,options):response(url.endsWith('/user')?{id:'verified-player'}:{ok:true});},
    respond:(body,options)=>({body:body?JSON.parse(body):null,...options})});
  const request=(body={...run,name:'Raven'},authorization='Bearer player-jwt',method='POST')=>({method,headers:{get:()=>authorization},text:async()=>typeof body==='string'?body:JSON.stringify(body)});
  return {handle,request,calls};
}
test('Edge Function verifies player JWT with Auth and uses that identity, not browser claims',async()=>{
  const {handle,request,calls}=edgeFixture();const result=await handle(request({...run,name:'Raven',userId:'attacker'}));
  assert.equal(result.status,200);assert.deepEqual(result.body,{ok:true,duplicate:false,improved:false});
  assert.equal(calls[0].headers.Authorization,'Bearer player-jwt');assert.match(calls[0].url,/auth\/v1\/user$/);
  assert.equal(JSON.parse(calls[1].body).p_user,'verified-player');
  assert.equal(calls[1].headers.Authorization,'Bearer server-only-test-secret');
  assert.doesNotMatch(JSON.stringify(result),/server-only-test-secret/);
});
test('the same guest session submits distinct runs, including a lower score',async()=>{
  const {client,calls}=fixture(url=>url.includes('/auth/')?response({access_token:'token',refresh_token:'refresh',expires_at:4600}):response({ok:true,personalBest:run.score,duplicate:false}));
  const first=await client.postScore(run,'Raven');
  const second=await client.postScore({...run,runId:'12345678-1234-4234-8234-123456789abd',score:3994},'Raven');
  assert.equal(first.ok,true);assert.equal(second.ok,true);assert.match(second.message,/Run saved \(3994\)/);assert.match(second.message,/best is 5628/);
  assert.equal(calls.filter(c=>c.url.includes('/auth/')).length,1);
  const submissions=calls.filter(c=>c.url.includes('/functions/'));assert.equal(submissions.length,2);
  assert.notEqual(submissions[0].body.runId,submissions[1].body.runId);assert.equal(submissions[0].headers.Authorization,submissions[1].headers.Authorization);
});
test('idempotent resubmissions tell the player that the run is already saved',async()=>{
  const {client}=fixture(url=>url.includes('/auth/')?response({access_token:'token',refresh_token:'refresh',expires_at:4600}):response({ok:true,personalBest:run.score,duplicate:true}));
  assert.match((await client.postScore(run,'Raven')).message,/already saved/);
});
test('run-history migration preserves bests, protects history and deduplicates any previous run',async()=>{
  const sql=await readFile('supabase/migrations/202610260001_run_history.sql','utf8');
  assert.match(sql,/create table public.garden_runs/);assert.match(sql,/primary key \(user_id, run_id\)/);
  assert.match(sql,/revoke all on public.garden_runs from public, anon, authenticated/);
  assert.match(sql,/existing_run.score <> p_score/);assert.match(sql,/interval '5 seconds'/);
  assert.match(sql,/insert into public.garden_runs/);assert.match(sql,/greatest\(garden_scores.score, excluded.score\)/);
  assert.doesNotMatch(sql,/drop table|delete from|truncate /i);
});
test('Edge Function preflight/method/auth/schema checks stop unauthorized database work',async()=>{
  for(const [method,token,body,status] of [['OPTIONS','',{},204],['GET','',{},405],['POST','',{},401],['POST','Bearer token','bad json',400],['POST','Bearer token','x'.repeat(2049),413]]){
    const {handle,request,calls}=edgeFixture();const result=await handle(request(body,token,method));
    assert.equal(result.status,status);assert.equal(result.headers['Access-Control-Allow-Origin'],'*');assert.equal(calls.length,0);
  }
});
test('Edge Function rejects forged/expired auth and does not leak database errors',async()=>{
  const denied=edgeFixture(()=>response({message:'private'},401));assert.equal((await denied.handle(denied.request())).status,401);assert.equal(denied.calls.length,1);
  const failed=edgeFixture(url=>response(url.endsWith('/user')?{id:'verified'}:{message:'private SQL error'},url.endsWith('/user')?200:500));
  assert.deepEqual((await failed.handle(failed.request())).body,{error:'temporarily_unavailable'});
  const limited=edgeFixture(url=>response(url.endsWith('/user')?{id:'verified'}:{rate_limited:true}));assert.equal((await limited.handle(limited.request())).status,429);
});
test('migration closes direct browser access and exposes only fixed Top 10 and service-only writes',async()=>{
  const sql=await readFile('supabase/migrations/202610250001_global_leaderboard.sql','utf8');
  assert.match(sql,/enable row level security/);assert.match(sql,/revoke all on public.garden_scores from public, anon, authenticated/);
  assert.match(sql,/grant execute on function public.garden_top_scores\(\) to anon, authenticated/);
  assert.match(sql,/grant execute on function public.submit_garden_score\(uuid,text,integer,uuid,integer\) to service_role/);
  assert.match(sql,/pg_advisory_xact_lock/);assert.match(sql,/interval '30 seconds'/);assert.match(sql,/last_run_id = p_run/);assert.match(sql,/limit 10/);
});
