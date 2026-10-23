// Original ZzFX sound designs: short impact, drying-out cue, and a descending defeat sting.
export const FAILURE_SOUNDS={
  hit:[.23,0,120,.003,.025,.1,4,1,-.25,0,0,0,0,.05],
  dry:[.18,0,220,.01,.025,.22,0,1,-.3,0,-70,.08,0,.03],
  loss:[.2,0,360,.02,.08,.48,1,1,-.55,0,-90,.13,0,0,0,0,.04,.65]
};
export function failureCues(reason){
  return reason==='water'?['dry','loss']:reason==='bug'||reason==='terrain'?['hit','loss']:[];
}
export function createFailureAudio(Sound){
  const sounds=Object.fromEntries(Object.entries(FAILURE_SOUNDS).map(([name,params])=>[name,new Sound([...params])]));
  return {play(reason,{muted=true}={}){
    if(muted)return [];
    const cues=failureCues(reason);
    for(const cue of cues)try{sounds[cue].play();}catch{/* Optional audio must never interrupt gameplay. */}
    return cues;
  }};
}
