export function validateSubmission(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const {score,completedGardens,durationSeconds,runId}=body,name=typeof body.name==='string'?body.name.trim():'';
  if(!/^[A-Za-z0-9 _-]{3,24}$/.test(name)||!Number.isSafeInteger(score)||score<0||score>10000||completedGardens!==3||!Number.isSafeInteger(durationSeconds)||durationSeconds<10||durationSeconds>86400||!(/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i).test(runId||''))return null;
  return {score,name,durationSeconds,runId};
}
