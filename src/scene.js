import { art } from './art.js';
import { bugsAt } from './arcade.js';
import { renderVine, renderVineTip, renderCaptureFlow } from './vine.js';
import { bugFlightPose } from './bug-flight.js';
import { potPlacement } from './pot.js';
import { renderDragGuide } from './drag-guide.js';
import { renderBranchHazard } from './hazards.js';
import { createForestBackgroundRenderer } from './background.js';

const renderForestBackground=createForestBackgroundRenderer();

function oval(c,x,y,rx,ry,color,angle=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();}
function leaf(c,x,y,size,angle,color){
  c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(size*.2,-size*.6,size,-size*.6,size,0);c.bezierCurveTo(size*.6,size*.35,size*.2,size*.2,0,0);c.fill();c.restore();
}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}

export function renderScene(c,{garden:g,view:v,ticks,phase,reducedMotion,particles,popups,dragGuide=false,dragGuideSeconds=0,backgroundSeconds=0}){
  const t=reducedMotion?0:ticks/60;
  const root=g.level.start,pot=potPlacement(root);
  c.save();c.setTransform(v.dpr,0,0,v.dpr,0,0);
  renderForestBackground(c,v,art.darkForest,{seconds:backgroundSeconds,reducedMotion,floorY:v.y+(pot.y+pot.height)*v.scale-3});
  for(let i=0;i<40;i++){
    const x=(i*139.3+Math.sin(t*.3+i)*12)%v.width,y=(i*97.7+Math.cos(t*.4+i)*15)%v.height;
    oval(c,x,y,i%3===0?2:1,i%3===0?2:1,`rgba(201,235,145,${.12+(Math.sin(t+i)+1)*.12})`);
  }
  if(phase==='title'||phase==='credits'){c.restore();return;}
  c.translate(v.x,v.y);c.scale(v.scale,v.scale);
  for(const rect of g.level.rocks)renderBranchHazard(c,rect,art.barbedBranch,art.timberTiles);
  g.level.dew.forEach((d,i)=>{
    if(g.collected[i])return;
    const y=d.y+Math.sin(t*2+i)*3;glow(c,d.x,y,30,'#6fd6e62b');
    c.save();c.translate(d.x,y);c.fillStyle='#69d5e4';c.beginPath();c.moveTo(0,-15);c.bezierCurveTo(-3,-8,-13,2,-9,10);c.bezierCurveTo(-4,19,13,15,10,5);c.bezierCurveTo(7,-3,2,-10,0,-15);c.fill();oval(c,-3,4,2,5,'#d5ffff');c.restore();
  });
  // Draw the planter behind the stem so growth remains visible above the soil.
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
      oval(c,0,0,11,17,f.color,-.3);leaf(c,-7,12,15,-1.1,'#679e56');c.fillStyle='#fff4d3';c.font='400 13px "Kaph", Arial, sans-serif';c.textAlign='center';c.fillText('✦',0,-30);
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
    c.fillStyle=bug.stunned?'#f9d580':color;c.font='400 17px "Kaph", Arial, sans-serif';c.textAlign='center';c.fillText(bug.stunned?'✧':bug.warning?'!':bug.kind==='hunter'?'⌁':bug.kind==='charger'?'↯':'·',0,-29);
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
  if(dragGuide?.length&&phase==='playing')renderDragGuide(c,art.tutorialHand,dragGuide[0],dragGuide.at(-1),dragGuideSeconds,{reducedMotion,scale:v.scale,route:dragGuide});
  for(const p of particles){c.globalAlpha=p.life;oval(c,p.x,p.y,p.size||3,p.size||3,p.color);}c.globalAlpha=1;
  for(const p of popups){c.globalAlpha=Math.min(1,p.life*2);c.font='400 17px "Kaph", Arial, sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#071f20';c.strokeText(p.text,p.x,p.y);c.fillStyle=p.color;c.fillText(p.text,p.x,p.y);}c.globalAlpha=1;
  c.restore();
}
