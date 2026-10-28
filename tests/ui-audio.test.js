import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createUIAudio,bindButtonAudio} from '../src/ui-audio.js';

function fixture(){
  const players=[];let muted=false,time=0;
  const audio=createUIAudio({baseUrl:'./',isMuted:()=>muted,now:()=>time,createAudio:src=>{
    const player={src,plays:0,pauses:0,currentTime:0,play(){this.plays++;return Promise.resolve();},pause(){this.pauses++;}};
    players.push(player);return player;
  }});
  return {audio,players,mute:value=>muted=value,tick:ms=>time+=ms};
}
test('UI audio uses two short local cues at restrained volumes without autoplay',()=>{
  const {players}=fixture();assert.equal(players.length,4);
  assert.ok(players.every(p=>p.plays===0&&p.preload==='auto'&&p.volume>0&&p.volume<.3));
  assert.ok(players.every(p=>p.src.startsWith('./assets/audio/ui-')));
});
test('hover is throttled while selections confirm independently',()=>{
  const {audio,players,tick}=fixture();
  assert.equal(audio.play('hover'),true);assert.equal(audio.play('hover'),false);
  assert.equal(audio.play('select'),true);tick(100);assert.equal(audio.play('hover'),true);
  assert.equal(players.reduce((n,p)=>n+p.plays,0),3);
});
test('muting suppresses both cues and stops any in-progress UI playback',()=>{
  const {audio,players,mute}=fixture();audio.play('select');mute(true);audio.stop();
  assert.equal(audio.play('select'),false);assert.equal(audio.play('hover'),false);
  assert.equal(players.reduce((n,p)=>n+p.plays,0),1);assert.ok(players.every(p=>p.pauses>0));
  mute(false);assert.equal(audio.play('select'),true);
});
test('autoplay rejection and unavailable audio output never crash menu actions',async()=>{
  for(const play of [()=>{throw Error('unavailable');},()=>Promise.reject(Error('blocked'))]){
    const audio=createUIAudio({createAudio:()=>({pause(){},play})});
    assert.doesNotThrow(()=>audio.play('select'));await Promise.resolve();
  }
});

function eventsFixture(){
  const handlers=new Map(),played=[];
  const button={tagName:'BUTTON',disabled:false,dataset:{},closest:()=>button,getClientRects:()=>[{}],contains:target=>target===button};
  const root={visibilityState:'visible',activeElement:button,defaultView:{navigator:{userActivation:{hasBeenActive:false}},addEventListener(){},removeEventListener(){}},addEventListener:(name,handler)=>handlers.set(name,handler),removeEventListener:name=>handlers.delete(name)};
  const cleanup=bindButtonAudio(root,{play:kind=>played.push(kind),stop(){}});
  const fire=(name,extra={})=>handlers.get(name)?.({isTrusted:true,target:button,...extra});
  return {button,played,cleanup,fire};
}
test('programmatic focus is quiet; real hover/navigation cues do not repeat across child elements',()=>{
  const f=eventsFixture();f.fire('focusin');f.fire('pointerover',{pointerType:'mouse'});assert.deepEqual(f.played,[]);
  f.fire('pointerdown',{pointerType:'mouse'});f.fire('pointerover',{pointerType:'mouse'});
  f.fire('pointerover',{pointerType:'mouse',relatedTarget:f.button});assert.deepEqual(f.played,['hover']);
  f.fire('keydown',{code:'ArrowDown'});f.fire('focusin');assert.deepEqual(f.played,['hover','hover']);
  f.button.disabled=true;f.fire('click');assert.deepEqual(f.played,['hover','hover']);f.cleanup();
});
test('touch press-only controls confirm once, and disposal cancels queued clicks',async()=>{
  const f=eventsFixture();f.button.dataset.uiPressSound='true';
  f.fire('pointerdown',{pointerType:'touch'});f.fire('click',{pointerType:'touch'});await Promise.resolve();
  assert.deepEqual(f.played,['select']);f.button.dataset.uiPressSound='false';
  f.fire('click',{pointerType:'mouse'});f.cleanup();await Promise.resolve();assert.deepEqual(f.played,['select']);
});
