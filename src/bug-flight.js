// CC0 Kenney flight frames. Fixed body anchors prevent wing changes resizing/bobbing the insect.
export const BUG_ART_FILES={
  flyFlight1:'fly-flight-1.png',flyFlight2:'fly-flight-2.png',
  beeFlight1:'bee-flight-1.png',beeFlight2:'bee-flight-2.png'
};
const styles={
  fly:{keys:['flyFlight1','flyFlight2'],anchors:[{x:32,y:29},{x:37,y:23}],scale:.7},
  bee:{keys:['beeFlight1','beeFlight2'],anchors:[{x:24,y:30},{x:28,y:24}],scale:.75}
};
export function bugFlightPose(bug,index,time,{reducedMotion=false}={}){
  const species=bug.kind==='hunter'?'fly':'bee',style=styles[species];
  const rate=bug.kind==='charger'?26:bug.kind==='hunter'?20:18;
  const frame=reducedMotion||bug.stunned?0:Math.floor(time*rate+index*.67)%2;
  const heading=bug.heading||0,right=Math.cos(heading)>=0;
  return {species,frame,key:style.keys[frame],glowing:!bug.stunned,anchor:style.anchors[frame],scale:style.scale,flip:right?-1:1,
    tilt:reducedMotion ? 0 : bug.stunned ? .15 : Math.sin(heading)*Math.cos(heading)*.4,offsetY:bug.stunned?1.5:0};
}
