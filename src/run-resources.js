export const RUN_REWINDS=3,REWIND_PENALTY=100;
export const RUN_RETRIES=3,RETRY_PENALTY=300;

export function createRunResources(){
  let remaining=RUN_REWINDS;
  let retriesUsed=0;
  const retryPenalty=()=>retriesUsed*RETRY_PENALTY;
  const rewindPenalty=()=>(RUN_REWINDS-remaining)*REWIND_PENALTY;
  return {
    get remaining(){return remaining;},
    get rewindPenalty(){return rewindPenalty();},
    get retryPenalty(){return retryPenalty();},
    get penalty(){return rewindPenalty()+retryPenalty();},
    get retriesLeft(){return RUN_RETRIES-retriesUsed;},
    useRetry(){if(retriesUsed>=RUN_RETRIES)return false;retriesUsed++;return true;},
    useRewind(){if(!remaining)return false;remaining--;return true;},
    score(grossScore){return Math.max(0,grossScore-rewindPenalty()-retryPenalty());}
  };
}
