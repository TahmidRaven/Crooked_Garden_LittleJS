import { art } from './art.js';
import { bugsAt } from './arcade.js';
import { bloomCount } from './game.js';
import { renderVine, renderVineTip, renderCaptureFlow } from './vine.js';
import { bugFlightPose } from './bug-flight.js';
import { potPlacement } from './pot.js';

function oval(c,x,y,rx,ry,color,angle=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();}
function leaf(c,x,y,size,angle,color){
  c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(size*.2,-size*.6,size,-size*.6,size,0);c.bezierCurveTo(size*.6,size*.35,size*.2,size*.2,0,0);c.fill();c.restore();
}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}

export function renderScene(c,{garden:g,light,view:v,ticks,phase,reducedMotion,particles,popups}){
  const t=reducedMotion?0:ticks/60,life=bloomCount(g)/3;
  c.save();c.setTransform(v.dpr,0,0,v.dpr,0,0);
  const bg=c.createLinearGradient(0,0,0,v.height);bg.addColorStop(0,'#061d27');bg.addColorStop(.55,'#143e37');bg.addColorStop(1,'#061d1b');c.fillStyle=bg;c.fillRect(0,0,v.width,v.height);
  glow(c,v.width*.5,v.height*.35,v.height*.65,`rgba(86,143,91,${.16+life*.1})`);
  // Distant trunks and layered silhouettes extend to the screen edges, not a framed board.
  for(let i=0;i<18;i++){
    const x=(i*173.3)%v.width,w=15+i%4*7;
    c.fillStyle=i%2?'#061f2588':'#0b2c2a99';c.beginPath();c.moveTo(x,v.height);c.lineTo(x+w*.4,0);c.lineTo(x+w,0);c.lineTo(x+w*1.5,v.height);c.fill();
  }
  if(art.foliage){
    c.save();c.globalAlpha=.3;
    for(let i=0;i<4;i++){
      const size=Math.min(260,v.height*.4);c.drawImage(art.foliage,-size*.55,i*v.height/4,size,size*1.2);
      c.save();c.translate(v.width,0);c.scale(-1,1);c.drawImage(art.foliage,-size*.55,80+i*v.height/4,size,size*1.2);c.restore();
    }
    c.restore();
  }
  for(let i=0;i<40;i++){
    const x=(i*139.3+Math.sin(t*.3+i)*12)%v.width,y=(i*97.7+Math.cos(t*.4+i)*15)%v.height;
    oval(c,x,y,i%3===0?2:1,i%3===0?2:1,`rgba(201,235,145,${.12+(Math.sin(t+i)+1)*.12})`);
  }
  c.translate(v.x,v.y);c.scale(v.scale,v.scale);
  // Mossy floating roots are collision shelves; their shape stays visibly solid.
  for(const r of g.level.rocks){
    c.fillStyle='#06191699';c.beginPath();c.roundRect(r.x+3,r.y+8,r.w,r.h+5,8);c.fill();
    c.fillStyle='#2b4841';c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,8);c.fill();
    c.fillStyle='#527954';c.beginPath();c.roundRect(r.x,r.y,r.w,8,4);c.fill();
    for(let i=0;i<r.w;i+=23){leaf(c,r.x+i+9,r.y+3,13,-1.2,'#6f9a57');c.strokeStyle='#274c39';c.lineWidth=2;c.beginPath();c.moveTo(r.x+i+10,r.y+r.h);c.quadraticCurveTo(r.x+i+4,r.y+r.h+17,r.x+i+12,r.y+r.h+24);c.stroke();}
  }
  glow(c,light.x,light.y,100,'#f6d97b20');
  if(phase==='playing'){
    c.strokeStyle='#f8e6a799';c.lineWidth=1;c.setLineDash([3,6]);c.beginPath();c.arc(light.x,light.y,17,0,Math.PI*2);c.stroke();c.setLineDash([]);
    oval(c,light.x,light.y,3,3,'#fff2b6');
  }
  g.level.dew.forEach((d,i)=>{
    if(g.collected[i])return;
    const y=d.y+Math.sin(t*2+i)*3;glow(c,d.x,y,30,'#6fd6e62b');
    c.save();c.translate(d.x,y);c.fillStyle='#69d5e4';c.beginPath();c.moveTo(0,-15);c.bezierCurveTo(-3,-8,-13,2,-9,10);c.bezierCurveTo(-4,19,13,15,10,5);c.bezierCurveTo(7,-3,2,-10,0,-15);c.fill();oval(c,-3,4,2,5,'#d5ffff');c.restore();
  });
  // Draw the planter behind the stem so growth remains visible above the soil.
  const root=g.level.start,pot=potPlacement(root);
  glow(c,root.x,root.y+15,60,'#69b66420');oval(c,root.x,pot.y+pot.height-1,37,7,'#03171499');
  if(art.flowerPot)c.drawImage(art.flowerPot,pot.x,pot.y,pot.width,pot.height);
  else{oval(c,root.x,root.y+28,47,14,'#132e26');for(let i=0;i<5;i++)leaf(c,root.x+(i-2)*9,root.y+27,34,-2.8+i*.5,'#396b3d');}
  const path=g.path;
  if(g.lastCapture&&g.clock-g.lastCapture.clock<1.35){
    const capture=g.lastCapture,fade=1-(g.clock-capture.clock)/1.35;
    c.save();c.globalAlpha=reducedMotion ? .4 : fade;c.beginPath();
    capture.polygon.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();
    c.fillStyle='#c8eb7e20';c.fill();c.strokeStyle='#efdfa0';c.lineWidth=4;c.stroke();
    for(const bug of capture.bugs){glow(c,bug.x,bug.y,40,'#e6ef9255');oval(c,bug.x,bug.y,7,7,'#fff0b6');}
    c.restore();
  }
  renderVine(c,g,{reducedMotion});
  if(g.lastCapture)renderCaptureFlow(c,g.lastCapture,g.clock-g.lastCapture.clock,{reducedMotion});
  g.level.flowers.forEach((f,i)=>{
    const alive=g.bloomed[i];glow(c,f.x,f.y,alive?65:43,alive?`${f.color}44`:`${f.color}20`);
    c.save();c.translate(f.x,f.y);c.strokeStyle='#58844d';c.lineWidth=4;c.beginPath();c.moveTo(0,30);c.quadraticCurveTo(-5,12,0,0);c.stroke();leaf(c,0,23,19,-.65,'#609b52');
    if(alive){
      for(let j=0;j<7;j++){const a=j*Math.PI*2/7;oval(c,Math.cos(a)*17,Math.sin(a)*17,14,9,f.color,a);}oval(c,0,0,9,9,'#ffe4a1');
    }else{
      c.strokeStyle=`${f.color}99`;c.lineWidth=2;c.setLineDash([2,7]);c.beginPath();c.arc(0,0,27+Math.sin(t*2+i)*2,0,Math.PI*2);c.stroke();c.setLineDash([]);
      oval(c,0,0,11,17,f.color,-.3);leaf(c,-7,12,15,-1.1,'#679e56');c.fillStyle='#fff4d3';c.font='bold 13px Arial';c.textAlign='center';c.fillText('✦',0,-30);
    }
    c.restore();
  });
  for(const [index,bug] of bugsAt(g).entries()){
    if(bug.captured)continue;
    const color=bug.kind==='hunter'?'#f49a76':bug.kind==='charger'?'#ed8cae':'#e9c171';
    c.save();c.translate(bug.x,bug.y);
    if(bug.warning&&!bug.stunned){
      c.save();c.rotate(bug.heading);c.fillStyle='#f77a7730';c.beginPath();c.moveTo(0,0);c.lineTo(130,-20);c.lineTo(130,20);c.fill();c.strokeStyle='#ffb49e';c.setLineDash([5,5]);c.beginPath();c.moveTo(0,0);c.lineTo(130,0);c.stroke();c.setLineDash([]);c.restore();
      glow(c,0,0,35,'#fc7b7844');
    }
    // Idle airborne bugs flap too; once play starts, the simulation clock freezes flight on pause.
    const flightTime=g.started?g.clock:(phase==='playing'||phase==='title'?t:0);
    const pose=bugFlightPose(bug,index,flightTime,{reducedMotion}),sprite=art[pose.key];
    if(pose.glowing)glow(c,0,0,34,'#ffe39a38');
    c.strokeStyle=bug.stunned?'#e9d99a':color;c.lineWidth=2;c.setLineDash(bug.stunned?[3,5]:[]);c.beginPath();c.arc(0,0,23,0,Math.PI*2);c.stroke();c.setLineDash([]);
    c.save();c.translate(0,pose.offsetY);c.rotate(pose.tilt);c.scale(pose.flip,1);
    if(sprite)c.drawImage(sprite,-pose.anchor.x*pose.scale,-pose.anchor.y*pose.scale,sprite.width*pose.scale,sprite.height*pose.scale);
    else{
      const wing=pose.frame?9:14;
      oval(c,-7,-9,5,wing,'#d9f1e5bb',-.65);oval(c,8,-9,5,wing,'#e8f8ecdd',.65);
      oval(c,0,0,16,11,pose.species==='bee'?'#f1cb39':'#c99647');oval(c,-8,-2,3,3,'#102d23');
    }
    c.restore();
    c.fillStyle=bug.stunned?'#f9d580':color;c.font='bold 17px Arial';c.textAlign='center';c.fillText(bug.stunned?'✧':bug.warning?'!':bug.kind==='hunter'?'⌁':bug.kind==='charger'?'↯':'·',0,-29);
    c.restore();
  }
  const tip=path.at(-1);
  if(g.loopHint&&phase==='playing'){
    const join=g.loopHint.join;c.strokeStyle='#e9e8a8';c.lineWidth=2;c.setLineDash([3,5]);c.beginPath();c.moveTo(tip.x,tip.y);c.lineTo(join.x,join.y);c.stroke();c.setLineDash([]);
    c.beginPath();c.arc(join.x,join.y,13,0,Math.PI*2);c.stroke();
  }
  glow(c,tip.x,tip.y,g.burst>0?60:30,g.burst>0?'#ffcf6d55':'#c9f48130');
  if(g.burst>0||g.grace>0){c.strokeStyle=g.burst>0?'#ffdc89':'#ccf3ce';c.lineWidth=4;c.beginPath();c.arc(tip.x,tip.y,23,0,Math.PI*2);c.stroke();}
  renderVineTip(c,g,{reducedMotion,phase});
  for(const p of particles){c.globalAlpha=p.life;oval(c,p.x,p.y,p.size||3,p.size||3,p.color);}c.globalAlpha=1;
  for(const p of popups){c.globalAlpha=Math.min(1,p.life*2);c.font='bold 17px Arial';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#071f20';c.strokeText(p.text,p.x,p.y);c.fillStyle=p.color;c.fillText(p.text,p.x,p.y);}c.globalAlpha=1;
  c.restore();
}
