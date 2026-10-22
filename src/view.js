import { WIDTH, HEIGHT } from './game.js';

export function fitViewport(width,height,dpr=1){
  // HUD and action dock live in screen space; the world retains its proportions.
  const landscape=width>height&&height<500;
  const top=landscape?24:92,bottom=landscape?24:94;
  const scale=Math.max(.1,Math.min((width-12)/WIDTH,(height-top-bottom)/HEIGHT));
  return {width,height,dpr:Math.min(2,dpr),scale,x:(width-WIDTH*scale)/2,y:top+(height-top-bottom-HEIGHT*scale)/2};
}
export function screenToGarden(view,x,y){
  return {x:Math.max(35,Math.min(565,(x-view.x)/view.scale)),y:Math.max(35,Math.min(660,(y-view.y)/view.scale))};
}
