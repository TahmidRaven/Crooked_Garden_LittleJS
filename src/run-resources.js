export const RUN_REWINDS=3,REWIND_PENALTY=100;

export function createRunResources(){
  let remaining=RUN_REWINDS;
  return {
    get remaining(){return remaining;},
    get penalty(){return (RUN_REWINDS-remaining)*REWIND_PENALTY;},
    useRewind(){if(!remaining)return false;remaining--;return true;},
    score(grossScore){return Math.max(0,grossScore-(RUN_REWINDS-remaining)*REWIND_PENALTY);}
  };
}
