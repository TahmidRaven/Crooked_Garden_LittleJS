import { advance, createGarden, distance, GROW_SPEED } from './game.js';

export const BURST_COST=30, BURST_DURATION=.45, BURST_COOLDOWN=2, BURST_SPEED=280;
const terminal=g=>['won','blocked','dry'].includes(g.status);
let nonce=0;
function freshSeed(){
  const bytes=new Uint32Array(1);
  if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);
  else bytes[0]=Math.random()*0xffffffff;
  return (bytes[0]+ ++nonce)>>>0;
}
function random(g){
  let x=g.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;g.rngState=x>>>0;
  return g.rngState/4294967296;
}
const between=(g,a,b)=>a+(b-a)*random(g);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function pickTarget(g,bug){
  bug.target={x:between(g,bug.zone.left,bug.zone.right),y:between(g,bug.zone.top,bug.zone.bottom)};
  bug.retarget=between(g,.65,1.7);
}
export function createArcade({seed=freshSeed(),stage=0}={}){
  const g=Object.assign(createGarden(stage),{seed:seed>>>0,rngState:(seed>>>0)||0x6d2b79f5,clock:0,started:false,burst:0,cooldown:0,queued:false,swatted:0,grace:0,hitBugs:[]});
  const kinds=['wanderer','hunter','charger'];
  for(let i=kinds.length-1;i>0;i--){const j=Math.floor(random(g)*(i+1));[kinds[i],kinds[j]]=[kinds[j],kinds[i]];}
  g.enemies=g.level.enemyZones.map((zone,i)=>{
    const bug={kind:kinds[i%3],zone:{...zone},radius:15,heading:between(g,-Math.PI,Math.PI),speed:between(g,40,62)+stage*6,state:'roam',timer:between(g,1.5,3.2),animation:0};
    for(let attempt=0;attempt<30;attempt++){
      bug.x=between(g,zone.left+20,zone.right-20);bug.y=between(g,zone.top+8,zone.bottom-8);
      if(g.level.flowers.every(flower=>distance(bug,flower)>55))break;
    }
    pickTarget(g,bug);return bug;
  });
  g.stunned=g.enemies.map(()=>0);g.hitBugs=g.enemies.map(()=>false);
  return g;
}
export function bugsAt(g){
  return g.enemies.map((bug,i)=>({x:bug.x,y:bug.y,radius:bug.radius,heading:bug.heading,kind:bug.kind,state:bug.state,warning:bug.state==='windup',animation:bug.animation,stunned:g.stunned[i]>0}));
}
function moveBug(g,bug,dt){
  const tip=g.path.at(-1),d=distance(bug,tip);bug.timer-=dt;bug.retarget-=dt;
  let speed=bug.speed;
  if(bug.kind==='charger'){
    if(bug.state==='windup'){
      if(bug.timer<=0){bug.state='dash';bug.timer=.48;}
      return;
    }
    if(bug.state==='dash'){
      speed=210;
      if(bug.timer<=0){bug.state='rest';bug.timer=between(g,.8,1.5);}
    }else if(bug.state==='rest'){
      if(bug.timer<=0){bug.state='roam';bug.timer=between(g,1.3,2.6);pickTarget(g,bug);}
      return;
    }else if(bug.timer<=0&&d<220){
      bug.state='windup';bug.timer=.65;bug.heading=Math.atan2(tip.y-bug.y,tip.x-bug.x);return;
    }
  }
  if(bug.state!=='dash'){
    if(bug.retarget<=0||distance(bug,bug.target)<12)pickTarget(g,bug);
    let target=bug.target;
    if(bug.kind==='hunter'&&d<200&&tip.y>bug.zone.top-45&&tip.y<bug.zone.bottom+45){
      target={x:clamp(tip.x,bug.zone.left,bug.zone.right),y:clamp(tip.y,bug.zone.top,bug.zone.bottom)};speed*=1.3;
    }
    const angle=Math.atan2(target.y-bug.y,target.x-bug.x),delta=Math.atan2(Math.sin(angle-bug.heading),Math.cos(angle-bug.heading));
    bug.heading+=clamp(delta,-2.8*dt,2.8*dt);
  }
  bug.x+=Math.cos(bug.heading)*speed*dt;bug.y+=Math.sin(bug.heading)*speed*dt;
  const {left,right,top,bottom}=bug.zone;
  if(bug.x<left||bug.x>right||bug.y<top||bug.y>bottom){
    bug.x=clamp(bug.x,left,right);bug.y=clamp(bug.y,top,bottom);
    if(bug.state==='dash'){bug.state='rest';bug.timer=.7;}
    else{pickTarget(g,bug);bug.heading=Math.atan2(bug.target.y-bug.y,bug.target.x-bug.x);}
  }
  bug.animation+=dt;
}
export function queueBurst(g){
  if(terminal(g)||g.cooldown>0||g.burst>0||g.water<=BURST_COST)return false;
  g.queued=!g.queued;return true;
}
function bugContact(g){
  let event=null;
  for(const [i,bug] of bugsAt(g).entries()){
    if(bug.stunned||distance(g.path.at(-1),bug)>bug.radius+6)continue;
    if(g.burst>0){
      g.stunned[i]=1.5;g.enemies[i].state='roam';g.enemies[i].timer=between(g,1,2);
      if(!g.hitBugs[i]){g.hitBugs[i]=true;g.swatted++;}event='swat';
    }else if(g.grace<=0){g.status='blocked';g.endedBy='bug';return 'blocked';}
  }
  return event;
}
export function tickArcade(g,target,{growing=false}={},dt=1/60){
  if(terminal(g)||!Number.isFinite(dt)||dt<=0)return null;
  if(!g.started&&!growing)return null;
  g.started=true;
  if(g.queued&&growing){
    g.queued=false;
    if(g.cooldown<=0&&g.water>BURST_COST){g.water-=BURST_COST;g.burst=BURST_DURATION;g.cooldown=BURST_COOLDOWN;}
  }
  const elapsed=Math.min(dt,.05),steps=Math.ceil(BURST_SPEED*elapsed/2),step=elapsed/steps;
  let event=null;
  for(let i=0;i<steps;i++){
    g.clock+=step;g.burst=Math.max(0,g.burst-step);g.cooldown=Math.max(0,g.cooldown-step);g.grace=Math.max(0,g.grace-step);
    g.enemies.forEach((bug,j)=>{if(g.stunned[j]<=0)moveBug(g,bug,step);});
    g.stunned=g.stunned.map(time=>Math.max(0,time-step));
    let contact=bugContact(g);if(contact==='blocked')return contact;event=contact||event;
    if(growing){
      const result=advance(g,target,step,g.burst>0?BURST_SPEED:GROW_SPEED);
      if(result==='flower'){
        g.stunned=g.stunned.map(time=>Math.max(time,.8));g.cooldown=0;
        g.enemies.forEach(bug=>{bug.state='roam';bug.timer=between(g,1,2);});
      }
      event=result||event;if(terminal(g))return event;
    }
    contact=bugContact(g);if(contact==='blocked')return contact;event=contact||event;
  }
  return event;
}
