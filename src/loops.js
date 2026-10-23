// Geometry only: closing the live tip against an older part of its stem forms a lasso.
export const LOOP_CLOSE_RADIUS=8, MIN_LOOP_LENGTH=100, MIN_LOOP_AREA=700;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cross=(a,b)=>a.x*b.y-a.y*b.x;

export function closestOnSegment(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
  return {x:a.x+t*dx,y:a.y+t*dy};
}
export function segmentIntersection(a,b,c,d){
  const r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},denom=cross(r,s);
  if(Math.abs(denom)<1e-8)return null; // Retracing a line alone is not a loop.
  const offset={x:c.x-a.x,y:c.y-a.y},t=cross(offset,s)/denom,u=cross(offset,r)/denom;
  if(t<0||t>1||u<0||u>1)return null;
  return {x:a.x+t*r.x,y:a.y+t*r.y};
}
export function polygonArea(points){
  let area=0;
  for(let i=0,j=points.length-1;i<points.length;j=i++)area+=points[j].x*points[i].y-points[i].x*points[j].y;
  return Math.abs(area)/2;
}
export function pointInLoop(point,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[j],b=polygon[i];
    if(distance(point,closestOnSegment(point,a,b))<1e-6)return false;
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function findClosedLoop(path,fromIndex=0,radius=LOOP_CLOSE_RADIUS){
  if(path.length<4)return null;
  const last=path.length-1,a=path[last-1],tip=path[last];
  let length=0;
  for(let i=last-2;i>=Math.max(0,fromIndex);i--){
    length+=distance(path[i+1],path[i+2]);
    const c=path[i],d=path[i+1];
    if(length+distance(c,d)<MIN_LOOP_LENGTH)continue;
    if(Math.max(a.x,tip.x)+radius<Math.min(c.x,d.x)||Math.min(a.x,tip.x)-radius>Math.max(c.x,d.x)||Math.max(a.y,tip.y)+radius<Math.min(c.y,d.y)||Math.min(a.y,tip.y)-radius>Math.max(c.y,d.y))continue;
    const intersection=segmentIntersection(a,tip,c,d),join=intersection||closestOnSegment(tip,c,d);
    if(!intersection&&distance(tip,join)>radius)continue;
    const polygon=[join,...path.slice(i+1,intersection?last:last+1)];
    const area=polygonArea(polygon);
    const loopLength=length+distance(join,d)-(intersection?distance(join,tip):0);
    if(area>=MIN_LOOP_AREA&&loopLength>=MIN_LOOP_LENGTH)return {join,polygon,area,length:loopLength};
  }
  return null;
}
