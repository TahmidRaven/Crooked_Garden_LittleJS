// Intentionally public browser configuration. Never add service-role/database secrets here.
export const SUPABASE_URL='https://jzixrgkpvbypiyfnshjq.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY='sb_publishable_haEk_cQv5Xyl6UJTZLzhFg_5oYAvHPe';
const SESSION_KEY='crooked-garden-global-session-v1',NAME_KEY='crooked-garden-public-name-v1';

function signInFailure(result){
  const code=result.data?.error_code||result.data?.code;
  if(code==='anonymous_provider_disabled')return 'Guest sign-in is disabled in this game’s Supabase project. The game owner needs to enable it.';
  if(code==='captcha_failed')return 'Guest sign-in requires CAPTCHA verification, which this build does not support yet.';
  if(result.status===429)return 'Too many guest sign-in attempts. Please wait and try again.';
  if(result.status===0)return 'Cannot reach guest sign-in. Check your connection and try again.';
  return 'Guest sign-in was rejected. Please try again; if it continues, contact the game owner.';
}

export function createGlobalLeaderboard({fetcher=(...args)=>fetch(...args),storage=()=>globalThis.localStorage,now=()=>Date.now(),timeoutMS=10000}={}){
  let session=null,authRequest=null;
  try{session=JSON.parse(storage()?.getItem(SESSION_KEY)||'null');}catch{}
  async function request(path,{body={},token}={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMS);
    try{
      const response=await fetcher(`${SUPABASE_URL}${path}`,{
        method:'POST',signal:controller.signal,
        headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify(body)
      });
      let data;try{data=await response.json();}catch{}
      return {ok:response.ok,status:response.status,data};
    }catch{return {ok:false,status:0};}
    finally{clearTimeout(timer);}
  }
  async function authenticate(){
    if(session?.access_token&&Number(session.expires_at)>now()/1000+60)return {token:session.access_token};
    if(authRequest)return authRequest;
    authRequest=(async()=>{
      const refreshing=Boolean(session?.refresh_token);
      const result=await request(refreshing?'/auth/v1/token?grant_type=refresh_token':'/auth/v1/signup',{
        body:refreshing?{refresh_token:session.refresh_token}:{data:{}}
      });
      if(!result.ok||typeof result.data?.access_token!=='string'||typeof result.data?.refresh_token!=='string'){
        // Do not create new identities automatically after an expired/revoked session.
        if(refreshing&&[400,401].includes(result.status)){
          session=null;try{storage()?.removeItem(SESSION_KEY);}catch{}
        }
        return {token:null,message:signInFailure(result)};
      }
      session={access_token:result.data.access_token,refresh_token:result.data.refresh_token,
        expires_at:result.data.expires_at||Math.floor(now()/1000)+(result.data.expires_in||3600)};
      try{storage()?.setItem(SESSION_KEY,JSON.stringify(session));}catch{}
      return {token:session.access_token};
    })();
    try{return await authRequest;}finally{authRequest=null;}
  }
  return {
    getName(){try{return storage()?.getItem(NAME_KEY)||'Gardener';}catch{return 'Gardener';}},
    async getScores(){
      const result=await request('/rest/v1/rpc/garden_top_scores');
      if(!result.ok||!Array.isArray(result.data))return null;
      return result.data.slice(0,10).filter(e=>Number.isSafeInteger(e?.score)&&e.score>=0&&Number.isSafeInteger(e.rank)&&e.rank>0&&typeof e.name==='string')
        .map(e=>({rank:e.rank,score:e.score,name:e.name.slice(0,24)}));
    },
    async postScore(run,name){
      name=typeof name==='string'?name.trim():'';
      if(!/^[A-Za-z0-9 _-]{3,24}$/.test(name))return {ok:false,message:'Use 3–24 letters, numbers, spaces, _ or -.'};
      if(!run||!Number.isSafeInteger(run.score)||run.score<0||run.score>10000||run.completedGardens!==3||!Number.isSafeInteger(run.durationSeconds)||run.durationSeconds<10||run.durationSeconds>86400||!(/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i).test(run.runId||''))return {ok:false,message:'Only a completed three-garden run can be shared.'};
      const {token,message}=await authenticate();
      if(!token)return {ok:false,message};
      const result=await request('/functions/v1/submit-garden-score',{token,body:{...run,name}});
      if(result.ok&&result.data?.ok===true){
        try{storage()?.setItem(NAME_KEY,name);}catch{}
        const personalBest=Number.isSafeInteger(result.data.personalBest)?result.data.personalBest:run.score;
        return {ok:true,message:result.data.duplicate?'This run is already saved. Play again to submit a new run.':`Run saved (${run.score}). Your leaderboard best is ${personalBest}.`};
      }
      if(result.status===401){session=null;try{storage()?.removeItem(SESSION_KEY);}catch{}}
      const seconds=Number.isInteger(result.data?.retryAfterSeconds)?Math.max(1,Math.min(5,result.data.retryAfterSeconds)):5;
      return {ok:false,message:result.status===429?`Please wait ${seconds} seconds, then retry this run.`:'Could not share your score. Please try again later.'};
    }
  };
}
