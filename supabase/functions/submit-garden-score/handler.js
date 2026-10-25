import {validateSubmission} from './rules.js';

export const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
export function createSubmitHandler({url,key,fetcher=(...args)=>fetch(...args),respond=(data,options)=>new Response(data,options)}){
  const reply=(status,data)=>respond(status===204?null:JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
  return async request=>{
    if(request.method==='OPTIONS')return reply(204,null);
    if(request.method!=='POST')return reply(405,{error:'method_not_allowed'});
    const authorization=request.headers.get('Authorization')||'';
    if(!/^Bearer \S+$/i.test(authorization))return reply(401,{error:'sign_in_required'});
    if(!url||!key)return reply(503,{error:'not_configured'});
    try{
      const text=await request.text();
      if(text.length>2048)return reply(413,{error:'payload_too_large'});
      let body;try{body=validateSubmission(JSON.parse(text));}catch{return reply(400,{error:'invalid_submission'});}
      if(!body)return reply(400,{error:'invalid_submission'});
      // Never trust a player ID supplied by the browser or merely decode its JWT.
      const auth=await fetcher(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:authorization},signal:AbortSignal.timeout(8000)});
      if(!auth.ok)return reply(auth.status>=500?503:401,{error:'sign_in_required'});
      const user=await auth.json();
      if(typeof user.id!=='string')return reply(401,{error:'sign_in_required'});
      const result=await fetcher(`${url}/rest/v1/rpc/submit_garden_score`,{
        method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
        body:JSON.stringify({p_user:user.id,p_name:body.name,p_score:body.score,p_run:body.runId,p_seconds:body.durationSeconds}),
        signal:AbortSignal.timeout(8000)
      });
      if(!result.ok)return reply(503,{error:'temporarily_unavailable'});
      const data=await result.json();
      if(data?.rate_limited)return reply(429,{error:'rate_limited'});
      if(data?.ok!==true)return reply(400,{error:'invalid_submission'});
      return reply(200,{ok:true});
    }catch{return reply(503,{error:'temporarily_unavailable'});}
  };
}
