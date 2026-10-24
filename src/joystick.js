// Circular travel with a small neutral zone; direction is relative to the vine tip.
export function stickVector(dx,dy,radius,deadZone=.16){
  const distance=Math.hypot(dx,dy);
  if(!distance||radius<=0)return {x:0,y:0,travelX:0,travelY:0,growing:false};
  const travel=Math.min(distance,radius),growing=travel/radius>deadZone;
  return {x:growing?dx/distance:0,y:growing?dy/distance:0,travelX:dx/distance*travel,travelY:dy/distance*travel,growing};
}

export function createJoystick(element,{surface,enabled,onStart}){
  const overlay=element.parentElement;
  let pointer=null,origin={x:0,y:0},vector=stickVector(0,0,1);
  function reset(){
    const previous=pointer;pointer=null;vector=stickVector(0,0,1);
    element.style.setProperty('--stick-x','0px');element.style.setProperty('--stick-y','0px');
    element.classList.remove('active');
    surface.classList.remove('steering');
    overlay.hidden=true;
    if(previous!==null&&surface.hasPointerCapture(previous))surface.releasePointerCapture(previous);
  }
  function move(e){
    vector=stickVector(e.clientX-origin.x,e.clientY-origin.y,element.clientWidth*.3);
    element.style.setProperty('--stick-x',`${vector.travelX}px`);element.style.setProperty('--stick-y',`${vector.travelY}px`);
    element.classList.toggle('active',vector.growing);
  }
  surface.addEventListener('pointerdown',e=>{
    if(!enabled()||pointer!==null||e.button!==0)return;
    e.preventDefault();pointer=e.pointerId;origin={x:e.clientX,y:e.clientY};
    const r=surface.getBoundingClientRect();
    overlay.style.left=`${origin.x-r.left}px`;overlay.style.top=`${origin.y-r.top}px`;overlay.hidden=false;
    surface.classList.add('steering');
    surface.setPointerCapture(pointer);onStart();move(e);
  });
  surface.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();move(e);}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(type,e=>{if(e.pointerId===pointer)reset();});
  window.addEventListener('resize',reset);
  return {reset,get active(){return pointer!==null;},get vector(){return vector;}};
}
