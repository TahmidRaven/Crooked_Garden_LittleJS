// Offline high-resolution 2D render of Kenney's CC0 planter mesh. No 3D runtime is shipped.
import {readFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';

const text=await readFile('source-assets/flower-pot/plantSmall1.obj','utf8');
const materialText=await readFile('source-assets/flower-pot/plantSmall1.mtl','utf8');
const vertices=[],normals=[],faces=[],seen=new Set();let material='';
for(const raw of text.split(/\r?\n/)){
  const [type,...parts]=raw.trim().split(/\s+/);
  if(type==='v')vertices.push(parts.map(Number));
  else if(type==='vn')normals.push(parts.map(Number));
  else if(type==='usemtl')material=parts[0];
  else if(type==='f'&&material==='wood'){
    const indices=parts.map(p=>p.split('/').map(Number)),points=indices.map(p=>vertices[p[0]-1]);
    if(points.some(p=>p[1]>.065001))continue; // Container only; exclude the plant/stem.
    const key=indices.map(p=>p[0]).sort((a,b)=>a-b).join(',');if(seen.has(key))continue;seen.add(key);
    faces.push({points,normal:normals[indices[0][2]-1]});
  }
}
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const normalize=v=>v.map(x=>x/Math.hypot(...v));
const yaw=15*Math.PI/180,pitch=22*Math.PI/180;
const right=[Math.cos(yaw),0,-Math.sin(yaw)],up=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch)];
const camera=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],light=normalize([-.55,.8,1]);
const project=p=>({x:dot(p,right),y:-dot(p,up)});
const all=faces.flatMap(face=>face.points.map(project));
const minX=Math.min(...all.map(p=>p.x)),maxX=Math.max(...all.map(p=>p.x)),minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y));
const width=256,padding=8,scale=(width-padding*2)/(maxX-minX),height=Math.ceil((maxY-minY)*scale+padding*2);
const pixel=p=>({x:(p.x-minX)*scale+padding,y:(p.y-minY)*scale+padding});
const base=materialText.match(/newmtl wood[\s\S]*?Kd ([\d.]+) ([\d.]+) ([\d.]+)/).slice(1).map(v=>Number(v)*255);
const layer=face=>face.points.every(p=>Math.abs(p[1]-.065)<1e-6)?3:face.points.some(p=>p[1]<.000001)?2:1;
// Convex outer walls must occlude the recessed interior, not average-depth triangles.
const visible=faces.filter(face=>dot(face.normal,camera)>0).sort((a,b)=>layer(a)-layer(b)||a.points.reduce((n,p)=>n+dot(p,camera),0)-b.points.reduce((n,p)=>n+dot(p,camera),0));
const innerRim=vertices.filter(p=>Math.abs(p[1]-.065)<1e-6&&Math.hypot(p[0],p[2])<.038).sort((a,b)=>Math.atan2(a[2],a[0])-Math.atan2(b[2],b[0]));
const soilPoints=innerRim.map(p=>[p[0],.061,p[2]]).map(project).map(pixel).map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
let soilAdded=false;
const polygons=visible.map(face=>{
  const soil=face.points.every(p=>Math.abs(p[1]-.025)<1e-6);
  const amount=.7+.3*Math.max(0,dot(face.normal,light));
  const colour=(soil?[66,47,32]:base).map(v=>Math.round(v*amount));
  const points=face.points.map(project).map(pixel).map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
  let soilCap='';if(!soilAdded&&layer(face)>=2){soilAdded=true;soilCap=`<polygon points="${soilPoints}" fill="#49372a"/>`;}
  return soilCap+`<polygon points="${points}" fill="rgb(${colour.join(',')})" stroke="rgb(${colour.join(',')})" stroke-width=".55" stroke-linejoin="round"/>`;
}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${polygons}</svg>`;
await mkdir('public/assets/art',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2});
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
  const image=await page.screenshot({path:'public/assets/art/flower-pot.png',omitBackground:true});
  const anchor=pixel(project([0,.061,0]));
  console.log(JSON.stringify({width:width*2,height:height*2,anchor:{x:anchor.x*2,y:anchor.y*2},sha256:createHash('sha256').update(image).digest('hex')},null,2));
}finally{await browser.close();}
