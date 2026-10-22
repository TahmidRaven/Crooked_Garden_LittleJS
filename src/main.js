import './style.css';
import * as L from 'littlejsengine';
import { WIDTH, HEIGHT, MAX_WATER, createGarden, advance, rewind, bloomCount, finishGarden } from './game.js';

const $=id=>document.getElementById(id);
let garden=createGarden(), light={x:400,y:260}, held=false, paused=false, ticks=0, muted=true;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const music=new Audio(`${import.meta.env.BASE_URL}assets/calm-theme.ogg`);music.loop=true;music.volume=.22;
const chime=new L.Sound([.28,0,640,.01,.08,.2,1,1.4,0,0,220,.08]);
let particles=[];
function sound(){if(!muted)chime.play();}
function start(index=0){garden=createGarden(index);held=false;paused=false;particles=[];$('result').hidden=true;light={x:400,y:450};updateUI();}
function updateUI(){
  const saved=bloomCount(garden);
  $('level-number').textContent='RESTORATION EXPERIMENT';
  $('level-name').textContent=garden.level.name;$('level-hint').textContent=garden.level.hint;
  $('water').max=MAX_WATER;$('water').value=garden.water;$('water-label').textContent=Math.ceil(garden.water);
  $('water').classList.toggle('low',garden.water<150);
  $('flower-label').textContent=`${saved} / ${garden.bloomed.length}`;
  $('objective-hint').textContent=saved===3?'Every flower is alive. Garden restored!':saved?`Clear! Finish now, or save ${3-saved} more.`:'Hold to grow. Save 1 flower to clear; 3 for perfect.';
  garden.level.flowers.forEach((flower,i)=>{
    const item=$(`flower-${i}`);item.classList.toggle('saved',garden.bloomed[i]);
    item.textContent=`${garden.bloomed[i]?'✿':'○'} ${flower.name}${garden.bloomed[i]?' · saved':''}`;
  });
  $('finish').disabled=!saved||garden.status==='won';
  $('finish').textContent=saved?`Finish · ${saved} / 3 saved`:'Save 1 to finish';
  $('courtyard-label').textContent=saved===3?'THE RESTORED COURTYARD':saved?'LIFE IS RETURNING':'THE FORGOTTEN COURTYARD';
  $('dew-label').textContent=`${garden.collected.filter(Boolean).length} / ${garden.collected.length}`;
  $('undo').disabled=garden.path.length<2;
  $('state-label').textContent=garden.status==='won'?'In bloom':garden.status==='blocked'?'Time for another bend':garden.status==='dry'?'Needs a little dew':paused?'Taking a breath':held||keyboardGrowing()?'Following the light':'Hold to grow';
}
function showResult(){
  const won=garden.status==='won',saved=bloomCount(garden),perfect=saved===3;held=false;
  $('result-tag').textContent=won?`${'✿'.repeat(saved)}${'○'.repeat(3-saved)} · ${saved} OF 3 FLOWERS SAVED`:'THE GARDEN STILL NEEDS YOU';
  $('result-title').textContent=won?(perfect?'You brought it back.':'A little life returns.'):garden.status==='dry'?'The water ran out.':'A wall, not the end.';
  $('result-copy').textContent=won?(perfect?`All three flowers are blooming, with ${Math.ceil(garden.water)} water left. Your route restored the whole courtyard.`:`${saved} flower${saved===1?' is':'s are'} alive. ${garden.endedBy==='water'?'Your water ran out. ':''}Try a tighter route and gather dew to save the rest.`):garden.status==='dry'?'No flowers saved yet. Every stretch of vine spends water; reach a flower early and collect blue dew for longer routes.':`The vine hit a shelf. Rewind and steer around its edge.${saved?' The flowers you already saved still count.':''}`;
  $('next').textContent=won&&!perfect?'Try for all three →':'Plant a new route →';
  $('result-undo').hidden=perfect;$('result-finish').hidden=won||!saved;$('result').hidden=false;
  updateUI();
}
function doRewind(){rewind(garden);held=false;paused=false;$('result').hidden=true;updateUI();}
$('undo').onclick=doRewind;$('result-undo').onclick=doRewind;$('restart').onclick=()=>start(garden.index);
$('next').onclick=()=>start();
function finish(){if(finishGarden(garden))showResult();}
$('finish').onclick=finish;$('result-finish').onclick=finish;
$('music').onclick=async()=>{muted=!muted;$('music').textContent=muted?'♫ Sound off':'♫ Sound on';$('music').setAttribute('aria-pressed',String(!muted));if(muted)music.pause();else{try{await music.play();}catch{muted=true;$('music').textContent='♫ Sound unavailable';$('music').setAttribute('aria-pressed','false');}}};
function point(e){const r=L.mainCanvas.getBoundingClientRect();light.x=Math.max(35,Math.min(565,(e.clientX-r.left)/r.width*WIDTH));light.y=Math.max(35,Math.min(660,(e.clientY-r.top)/r.height*HEIGHT));}
function init(){
  const canvas=L.mainCanvas;canvas.style.touchAction='none';
  // LittleJS centers its canvas with a transform; our responsive root already sizes it.
  canvas.style.transform='none';
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!$('result').hidden)return;point(e);held=true;canvas.setPointerCapture(e.pointerId);$('game-root').focus({preventScroll:true});e.preventDefault();updateUI();});
  canvas.addEventListener('pointermove',point);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{held=false;updateUI();});
  window.addEventListener('blur',()=>held=false);
  document.addEventListener('visibilitychange',()=>{held=false;if(document.hidden)music.pause();else if(!muted)music.play().catch(()=>{});});
  $('game-root').addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
  $('flower-list').replaceChildren(...garden.level.flowers.map((flower,i)=>{const item=document.createElement('li');item.id=`flower-${i}`;return item;}));
  updateUI();
}
function keyboardGrowing(){return document.activeElement===$('game-root')&&L.keyIsDown('KeyG');}
function update(){
  ticks++;
  const keyboardActive=document.activeElement===$('game-root');
  if(keyboardActive&&L.keyWasPressed('KeyR'))start(garden.index);
  if(keyboardActive&&L.keyWasPressed('KeyZ'))doRewind();
  if(keyboardActive&&L.keyWasPressed('Space')){paused=!paused;held=false;}
  const move=6;
  if(keyboardActive&&L.keyIsDown('ArrowLeft'))light.x=Math.max(35,light.x-move);
  if(keyboardActive&&L.keyIsDown('ArrowRight'))light.x=Math.min(565,light.x+move);
  if(keyboardActive&&L.keyIsDown('ArrowUp'))light.y=Math.max(35,light.y-move);
  if(keyboardActive&&L.keyIsDown('ArrowDown'))light.y=Math.min(660,light.y+move);
  if(!paused&&(held||keyboardGrowing())&&$('result').hidden){
    const event=advance(garden,light);
    if(['dew','flower','won'].includes(event)){sound();const tip=garden.path.at(-1);for(let i=0;i<(reducedMotion?0:event==='won'?60:15);i++)particles.push({x:tip.x,y:tip.y,vx:(Math.random()-.5)*2.7,vy:-Math.random()*2.8,life:1,color:event==='dew'?'#78b8c3':'#e6ac69'});updateUI();}
    if(['blocked','dry','won'].includes(event))showResult();
  }
  particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.015;p.life-=.015;});
  if(ticks%5===0)updateUI();
}
function oval(ctx,x,y,rx,ry,color,angle=0){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2);ctx.fill();}
function leaf(ctx,x,y,size,angle,color){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(size*.2,-size*.65,size,-size*.6,size,0);ctx.bezierCurveTo(size*.6,size*.2,size*.2,size*.2,0,0);ctx.fill();ctx.strokeStyle='#f3f0d544';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(size*.85,-size*.12);ctx.stroke();ctx.restore();}
function render(){
  const c=L.mainContext;c.save();
  const saved=bloomCount(garden),life=saved/3;
  const bg=c.createLinearGradient(0,0,600,720);bg.addColorStop(0,`rgb(${225+22*life},${224+15*life},${213-life})`);bg.addColorStop(1,`rgb(${207+23*life},${207+16*life},${192+4*life})`);c.fillStyle=bg;c.fillRect(0,0,600,720);
  // Plaster grain and quiet masonry; deterministic positions, no frame-to-frame noise.
  for(let i=0;i<360;i++){const x=(i*137.51)%600,y=(i*73.19)%720;c.fillStyle=i%2?'#7b805009':'#ffffff28';c.fillRect(x,y,2+i%3,1+i%2);}
  c.strokeStyle='#a9a07a12';c.lineWidth=1;for(let row=0;row<8;row++){const y=90+row*77;c.beginPath();c.moveTo(40,y);c.lineTo(560,y);c.stroke();for(let col=0;col<4;col++){const x=col*180+(row%2?90:0);c.beginPath();c.moveTo(x,y);c.lineTo(x,y+77);c.stroke();}}
  c.fillStyle='#69725d';c.font='12px Georgia';c.textAlign='center';c.fillText(saved===3?'A whole garden, alive again.':'Bring the three dormant flowers back to life.',300,70);
  // Original code-drawn wall-climbing leaves.
  for(let side=0;side<2;side++)for(let i=0;i<11;i++){const x=side?575:25,y=100+i*51;leaf(c,x,y,19+(i%3)*3,side?-2.2:-.9,saved?(i%2?'#8fa66d':'#a8b67c'):'#a5a28e');}
  // Beam is player-controlled; its pool visibly marks the steering target.
  c.save();const beam=c.createRadialGradient(light.x,light.y,5,light.x,light.y,105);beam.addColorStop(0,'#ffefad75');beam.addColorStop(1,'#fff3b000');c.fillStyle=beam;c.fillRect(0,0,600,720);c.strokeStyle='#d9b66c77';c.setLineDash([3,7]);c.beginPath();c.arc(light.x,light.y,25,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='#c7a251';c.fillRect(light.x-4,light.y-1,8,2);c.fillRect(light.x-1,light.y-4,2,8);c.restore();
  for(const [i,r] of garden.level.rocks.entries()){
    c.fillStyle='#6a59331a';c.fillRect(r.x+4,r.y+7,r.w,r.h+5);c.fillStyle='#9c8664';c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,5);c.fill();c.fillStyle='#bca77e';c.fillRect(r.x+3,r.y+2,r.w-6,6);c.strokeStyle='#685c4244';c.beginPath();c.moveTo(r.x+12,r.y+16);c.lineTo(r.x+r.w-15,r.y+16);c.stroke();
    for(let j=0;j<7;j++)leaf(c,r.x+12+j*14,r.y+2,12,-.8-j%2,'#8c9d69');
    // Shelf brackets are decorative, not collision geometry.
    c.fillStyle='#b1a17b';c.beginPath();const bx=i%2?r.x+r.w-20:r.x+15;c.moveTo(bx,r.y+r.h);c.lineTo(bx,r.y+r.h+23);c.lineTo(bx+21,r.y+r.h);c.fill();
  }
  garden.level.dew.forEach((d,i)=>{if(garden.collected[i])return;const bob=reducedMotion?0:Math.sin(ticks/32+i)*3;c.save();c.translate(d.x,d.y+bob);oval(c,0,7,22,22,'#b5d8d21c');c.fillStyle='#79b6c0';c.beginPath();c.moveTo(0,-15);c.bezierCurveTo(-5,-7,-12,0,-10,7);c.bezierCurveTo(-8,19,9,19,11,7);c.bezierCurveTo(12,0,5,-7,0,-15);c.fill();oval(c,-4,4,2,5,'#e7f4eb',.4);c.restore();});
  const path=garden.path;
  if(path.length>1){
    c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(path[0].x,path[0].y);for(const p of path)c.lineTo(p.x,p.y);c.strokeStyle='#426546';c.lineWidth=9;c.stroke();c.strokeStyle='#8ca36a';c.lineWidth=3;c.stroke();
    for(let i=22;i<path.length;i+=28){const p=path[i],q=path[i-5],angle=Math.atan2(p.y-q.y,p.x-q.x)+(Math.floor(i/28)%2?-.9:2);leaf(c,p.x,p.y,16,angle,'#718c54');}
  }
  garden.level.flowers.forEach((flower,i)=>{
    const alive=garden.bloomed[i],{x,y,color}=flower;
    c.save();c.translate(x,y);
    if(alive){const glow=c.createRadialGradient(0,0,8,0,0,70);glow.addColorStop(0,`${color}55`);glow.addColorStop(1,`${color}00`);c.fillStyle=glow;c.fillRect(-70,-70,140,140);}
    c.strokeStyle=alive?'#6c8b51':'#8d8c74';c.lineWidth=3;c.beginPath();c.moveTo(0,32);c.quadraticCurveTo(-6,12,0,0);c.stroke();
    leaf(c,-2,22,alive?18:11,-.5,alive?'#8ca56b':'#a09b83');
    if(alive){for(let petal=0;petal<7;petal++){const a=petal*Math.PI*2/7;oval(c,Math.cos(a)*15,Math.sin(a)*15,13,8,color,a);}oval(c,0,0,8,8,'#f2d18a');}
    else{c.strokeStyle='#8d8c7477';c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();c.arc(0,0,25,0,Math.PI*2);c.stroke();c.setLineDash([]);oval(c,0,0,8,14,'#96927b',-.35);leaf(c,-5,10,13,-1.1,'#858b6f');}
    c.fillStyle=alive?'#425d38':'#65654f';c.font='11px Arial';c.textAlign='center';c.fillText(`${i+1} · ${alive?'SAVED':flower.name.toUpperCase()}`,0,49);
    c.restore();
  });
  const tip=path.at(-1);leaf(c,tip.x,tip.y,18,garden.heading-.4,'#a0af6e');leaf(c,tip.x,tip.y,13,garden.heading+.8,'#7d995e');
  // Pot is foreground; root visibly grows out of the soil.
  const root=garden.level.start;oval(c,root.x,root.y+55,50,9,'#776b3b15');c.fillStyle='#bb7b58';c.beginPath();c.moveTo(root.x-34,root.y+9);c.lineTo(root.x+34,root.y+9);c.lineTo(root.x+26,root.y+53);c.quadraticCurveTo(root.x,root.y+65,root.x-26,root.y+53);c.closePath();c.fill();c.fillStyle='#ce9067';c.beginPath();c.roundRect(root.x-39,root.y+2,78,15,4);c.fill();oval(c,root.x,root.y+3,33,7,'#705a3f');c.strokeStyle='#55754b';c.lineWidth=7;c.beginPath();c.moveTo(root.x,root.y+4);c.lineTo(root.x,root.y-5);c.stroke();leaf(c,root.x,root.y-1,24,-2.6,'#748e56');
  for(const p of particles){c.globalAlpha=p.life;oval(c,p.x,p.y,3,3,p.color);}c.globalAlpha=1;
  if(path.length===1){c.fillStyle='#69725d';c.font='italic 14px Georgia';c.textAlign='center';c.fillText('Hold to grow. Reach a closed bud.',300,710);}
  c.restore();
}
L.setGLEnable(false);L.setCanvasFixedSize(L.vec2(WIDTH,HEIGHT));L.setCanvasPixelated(false);L.setShowSplashScreen(false);L.setTouchGamepadEnable(false);
L.engineInit(init,update,()=>{},render,()=>{},[],$('game-root'));
// Read-only snapshot for debugging and browser checks; no gameplay shortcuts.
window.crookedGarden={getState:()=>({level:garden.index,status:garden.status,tip:{...garden.path.at(-1)},water:garden.water,dew:[...garden.collected],flowers:[...garden.bloomed],endedBy:garden.endedBy,points:garden.path.length,light:{...light}})};
