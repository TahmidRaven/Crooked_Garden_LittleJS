// Host-injected SDK only: no remote scripts, developer credentials, or required login.
// API contracts: https://docs.wavedash.com/sdk/{setup,leaderboards,achievements}
export const LEADERBOARD='Garden Masters';
export const ACHIEVEMENTS=['FIRST_BLOOM','BUG_GARDENER','DOUBLE_TROUBLE','THE_GARDEN_LIVES'];

export function createRunProgress(){
  let next=0;
  return {
    clear(stage,score){
      if(stage!==next||next>=3||!Number.isSafeInteger(score)||score<0)return null;
      next++;
      return next===3?score:null;
    }
  };
}

export function createWavedash({getSDK=()=>globalThis.Wavedash,timeoutMS=10000,retryMS=2000,maxTries=30}={}){
  let sdk=null,initialized=false,board=null,statsReady=false,flushing=false,retry=null,disposed=false;
  const earned=new Set(),pending=new Map();
  async function call(name,...args){
    if(disposed||typeof sdk?.[name]!=='function')return undefined;
    let timer;
    try{
      return await Promise.race([
        Promise.resolve(sdk[name](...args)),
        new Promise(resolve=>{timer=setTimeout(()=>resolve(undefined),timeoutMS);})
      ]);
    }catch{return undefined;}
    finally{clearTimeout(timer);}
  }
  async function leaderboard(){
    if(!sdk||disposed)return null;
    if(!board){
      board=call('getOrCreateLeaderboard',LEADERBOARD,1,0).then(result=>
        result?.success&&typeof result.data?.id==='string'?result.data.id:null);
      const id=await board;
      if(!id)board=null;
      return id;
    }
    return board;
  }
  async function flush(){
    if(!sdk||disposed||flushing)return;
    flushing=true;
    try{
      if(!statsReady)statsReady=Boolean((await call('requestStats'))?.success);
      for(const [id,tries] of pending){
        if(tries>=maxTries)continue;
        pending.set(id,tries+1);
        // Stats and achievements can finish loading at different times. Retry false.
        const result=statsReady?await call('setAchievement',id,true):undefined;
        if(result===true||result?.success===true)pending.delete(id);
      }
    }finally{
      flushing=false;
      if(!disposed&&[...pending.values()].some(tries=>tries<maxTries)){
        clearTimeout(retry);retry=setTimeout(flush,retryMS);
      }
    }
  }
  return {
    get active(){return Boolean(sdk)&&!disposed;},
    init(){
      if(initialized||disposed)return;
      initialized=true;
      try{
        const host=getSDK();
        if(typeof host?.init!=='function')return;
        host.init();sdk=host;
      }catch{return;}
      void leaderboard();
    },
    unlock(id){
      if(!sdk||disposed||!ACHIEVEMENTS.includes(id)||earned.has(id))return;
      earned.add(id);pending.set(id,0);void flush();
    },
    async postScore(score){
      if(!Number.isSafeInteger(score)||score<0)return false;
      const id=await leaderboard();
      if(!id)return false;
      return Boolean((await call('uploadLeaderboardScore',id,score,true))?.success);
    },
    async getScores(){
      const id=await leaderboard();
      if(!id)return null;
      const response=await call('listLeaderboardEntries',id,0,10,false);
      if(!response?.success||!Array.isArray(response.data))return null;
      return response.data.slice(0,10).filter(entry=>
        Number.isSafeInteger(entry?.score)&&entry.score>=0&&Number.isSafeInteger(entry.globalRank)&&entry.globalRank>0
      ).map(entry=>({rank:entry.globalRank,score:entry.score,name:typeof entry.username==='string'?entry.username.slice(0,80):'Gardener'}));
    },
    dispose(){disposed=true;clearTimeout(retry);pending.clear();}
  };
}
