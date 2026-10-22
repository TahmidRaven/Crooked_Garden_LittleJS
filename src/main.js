import './style.css';
import * as L from 'littlejsengine';
import { WIDTH, HEIGHT, MAX_WATER, LEVELS, createGarden, advance, rewind } from './game.js';

const $=id=>document.getElementById(id);
let garden=createGarden(), light={x:400,y:260}, held=false, paused=false, ticks=0, muted=true;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const music=new Audio(`${import.meta.env.BASE_URL}assets/calm-theme.ogg`);music.loop=true;music.volume=.22;
const chime=new L.Sound([.28,0,640,.01,.08,.2,1,1.4,0,0,220,.08]);
let particles=[];
function sound(){if(!muted)chime.play();}
function start(index=0){garden=createGarden(index);held=false;paused=false;particles=[];$('result').hidden=true;light={x:400,y:450};updateUI();}
function updateUI(){
  $('level-number').textContent=`0${garden.index+1} / 0${LEVELS.length}`;
  $('level-name').textContent=garden.level.name;$('level-hint').textContent=garden.level.hint;
  $('water').max=MAX_WATER;$('water').value=garden.water;$('water-label').textContent=`${Math.round(garden.water/MAX_WATER*100)}%`;
  $('dew-label').textContent=`${garden.collected.filter(Boolean).length} / ${garden.collected.length}`;
  $('undo').disabled=garden.path.length<2;
  $('state-label').textContent=garden.status==='won'?'In bloom':garden.status==='blocked'?'Time for another bend':garden.status==='dry'?'Needs a little dew':paused?'Taking a breath':held||keyboardGrowing()?'Following the light':'Hold to grow';
}
function showResult(){
  const won=garden.status==='won';held=false;
  $('result-tag').textContent=won?'A LITTLE ROOM TO BLOOM':'EVERY GARDENER STARTS SOMEWHERE';
  $('result-title').textContent=won?"You've found the light.":garden.status==='dry'?'A little more dew?':'Try another bend.';
  $('result-copy').textContent=won?`${garden.collected.filter(Boolean).length} of ${garden.collected.length} dew drops gathered. Your crooked little vine made it.`:garden.status==='dry'?'Collect blue droplets to keep your vine growing. Rewind and find a new route.':'The vine met an obstacle. Rewind a little, then aim the light around its edge.';
  $('next').textContent=won?(garden.index===LEVELS.length-1?'Grow again →':'Next garden →'):'Try this garden again';
  $('result-undo').hidden=won;$('result').hidden=false;
}
function doRewind(){rewind(garden);held=false;paused=false;$('result').hidden=true;updateUI();}
$('undo').onclick=doRewind;$('result-undo').onclick=doRewind;$('restart').onclick=()=>start(garden.index);
$('next').onclick=()=>start(garden.status==='won'?(garden.index+1)%LEVELS.length:garden.index);
$('music').onclick=async()=>{muted=!muted;$('music').textContent=muted?'♫ Sound off':'♫ Sound on';$('music').setAttribute('aria-pressed',String(!muted));if(muted)music.pause();else{try{await music.play();}catch{muted=true;$('music').textContent='♫ Sound unavailable';$('music').setAttribute('aria-pressed','false');}}};
function point(e){const r=L.mainCanvas.getBoundingClientRect();light.x=Math.max(35,Math.min(565,(e.clientX-r.left)/r.width*WIDTH));light.y=Math.max(35,Math.min(660,(e.clientY-r.top)/r.height*HEIGHT));}
function init(){
  const canvas=L.mainCanvas;canvas.style.touchAction='none';
  // LittleJS centers its canvas with a transform; our responsive root already sizes it.
  canvas.style.transform='none';
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;point(e);held=true;canvas.setPointerCapture(e.pointerId);$('game-root').focus({preventScroll:true});e.preventDefault();});
  canvas.addEventListener('pointermove',point);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>held=false);
  window.addEventListener('blur',()=>held=false);
  document.addEventListener('visibilitychange',()=>{held=false;if(document.hidden)music.pause();else if(!muted)music.play().catch(()=>{});});
  $('game-root').addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
  updateUI();
}
function keyboardGrowing(){return document.activeElement===$('game-root')&&L.keyIsDown('KeyG');}
function update(){
  ticks++;
  const keyboardActive=document.activeElement===$('game-root');
  if(keyboardActive&&L.keyWasPressed('KeyR'))start(garden.index);
  if(keyboardActive&&L.keyWasPressed('KeyZ'))doRewind();
  if(keyboardActive&&L.keyWasPressed('Space')){paused=!paused;held=false;}
  const move=3.5;
  if(keyboardActive&&L.keyIsDown('ArrowLeft'))light.x=Math.max(35,light.x-move);
  if(keyboardActive&&L.keyIsDown('ArrowRight'))light.x=Math.min(565,light.x+move);
  if(keyboardActive&&L.keyIsDown('ArrowUp'))light.y=Math.max(35,light.y-move);
  if(keyboardActive&&L.keyIsDown('ArrowDown'))light.y=Math.min(660,light.y+move);
  if(!paused&&(held||keyboardGrowing())&&$('result').hidden){
    const event=advance(garden,light);
    if(event==='dew'||event==='won'){sound();const tip=garden.path.at(-1);for(let i=0;i<(reducedMotion?0:event==='won'?60:15);i++)particles.push({x:tip.x,y:tip.y,vx:(Math.random()-.5)*2.7,vy:-Math.random()*2.8,life:1,color:event==='dew'?'#78b8c3':'#d9ad55'});}
    if(['blocked','dry','won'].includes(event))showResult();
  }
  particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.015;p.life-=.015;});
  if(ticks%5===0)updateUI();
}
function oval(ctx,x,y,rx,ry,color,angle=0){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2);ctx.fill();}
function leaf(ctx,x,y,size,angle,color){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(size*.2,-size*.65,size,-size*.6,size,0);ctx.bezierCurveTo(size*.6,size*.2,size*.2,size*.2,0,0);ctx.fill();ctx.strokeStyle='#f3f0d544';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(size*.85,-size*.12);ctx.stroke();ctx.restore();}
function render(){
  const c=L.mainContext;c.save();
  const bg=c.createLinearGradient(0,0,600,720);bg.addColorStop(0,'#f7efd4');bg.addColorStop(1,'#e6dfc4');c.fillStyle=bg;c.fillRect(0,0,600,720);
  // Plaster grain and quiet masonry; deterministic positions, no frame-to-frame noise.
  for(let i=0;i<360;i++){const x=(i*137.51)%600,y=(i*73.19)%720;c.fillStyle=i%2?'#7b805009':'#ffffff28';c.fillRect(x,y,2+i%3,1+i%2);}
  c.strokeStyle='#a9a07a12';c.lineWidth=1;for(let row=0;row<8;row++){const y=90+row*77;c.beginPath();c.moveTo(40,y);c.lineTo(560,y);c.stroke();for(let col=0;col<4;col++){const x=col*180+(row%2?90:0);c.beginPath();c.moveTo(x,y);c.lineTo(x,y+77);c.stroke();}}
  const sun=garden.level.goal;
  const glow=c.createRadialGradient(sun.x,sun.y,4,sun.x,sun.y,135);glow.addColorStop(0,'#ffdc7a90');glow.addColorStop(1,'#ffdc7900');c.fillStyle=glow;c.fillRect(0,0,600,300);
  c.save();c.translate(sun.x,sun.y);c.strokeStyle='#ceaa53';c.lineWidth=2;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(Math.cos(a)*32,Math.sin(a)*32);c.lineTo(Math.cos(a)*39,Math.sin(a)*39);c.stroke();}oval(c,0,0,22,22,'#e4ba60');oval(c,-5,-6,8,8,'#f5d88a');c.restore();
  // Original code-drawn wall-climbing leaves.
  for(let side=0;side<2;side++)for(let i=0;i<11;i++){const x=side?575:25,y=100+i*51;leaf(c,x,y,19+(i%3)*3,side?-2.2:-.9,i%2?'#a4ae81':'#b6bc95');}
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
  const tip=path.at(-1);leaf(c,tip.x,tip.y,18,garden.heading-.4,'#a0af6e');leaf(c,tip.x,tip.y,13,garden.heading+.8,'#7d995e');
  // Pot is foreground; root visibly grows out of the soil.
  const root=garden.level.start;oval(c,root.x,root.y+55,50,9,'#776b3b15');c.fillStyle='#bb7b58';c.beginPath();c.moveTo(root.x-34,root.y+9);c.lineTo(root.x+34,root.y+9);c.lineTo(root.x+26,root.y+53);c.quadraticCurveTo(root.x,root.y+65,root.x-26,root.y+53);c.closePath();c.fill();c.fillStyle='#ce9067';c.beginPath();c.roundRect(root.x-39,root.y+2,78,15,4);c.fill();oval(c,root.x,root.y+3,33,7,'#705a3f');c.strokeStyle='#55754b';c.lineWidth=7;c.beginPath();c.moveTo(root.x,root.y+4);c.lineTo(root.x,root.y-5);c.stroke();leaf(c,root.x,root.y-1,24,-2.6,'#748e56');
  if(garden.status==='won'){for(let i=0;i<7;i++){const a=i*Math.PI*2/7;oval(c,tip.x+Math.cos(a)*17,tip.y+Math.sin(a)*17,13,8,'#d8977b',a);}oval(c,tip.x,tip.y,10,10,'#e3b858');}
  for(const p of particles){c.globalAlpha=p.life;oval(c,p.x,p.y,3,3,p.color);}c.globalAlpha=1;
  if(path.length===1){c.fillStyle='#8c9678';c.font='italic 15px Georgia';c.textAlign='center';c.fillText('a little light goes a long way',300,590);}
  c.restore();
}
L.setGLEnable(false);L.setCanvasFixedSize(L.vec2(WIDTH,HEIGHT));L.setCanvasPixelated(false);L.setShowSplashScreen(false);L.setTouchGamepadEnable(false);
L.engineInit(init,update,()=>{},render,()=>{},[],$('game-root'));
// Read-only snapshot for debugging and browser checks; no gameplay shortcuts.
window.crookedGarden={getState:()=>({level:garden.index,status:garden.status,tip:{...garden.path.at(-1)},water:garden.water,dew:[...garden.collected],points:garden.path.length,light:{...light}})};
