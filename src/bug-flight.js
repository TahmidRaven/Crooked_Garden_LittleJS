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
export function warmHunterPixels(pixels){
  const result=new Uint8ClampedArray(pixels);
  for(let i=0;i<result.length;i+=4){
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2],light=(r+g+b)/3;
    // Only the neutral dark body/eyes: leave light wings, coloured pixels and alpha alone.
    if(!pixels[i+3]||Math.max(r,g,b)>=155||Math.max(r,g,b)-Math.min(r,g,b)>12)continue;
    if(light<72){result[i]=46+light*.5;result[i+1]=28+light*.3;result[i+2]=17+light*.18;}
    else{const t=Math.min(1,(light-72)/83);result[i]=190+60*t;result[i+1]=113+78*t;result[i+2]=40+45*t;}
  }
  return result;
}
