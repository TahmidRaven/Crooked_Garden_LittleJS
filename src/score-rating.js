// Visual progress against the global leader's score, not a placement/rank claim.
export function scoreRating(score,leaderScore){
  if(!Number.isSafeInteger(score)||score<0||!Number.isSafeInteger(leaderScore)||leaderScore<=0)return null;
  const ratio=score/leaderScore;
  return {stars:ratio>=1?3:ratio>=.75?2:ratio>=.5?1:0,percent:Math.floor(ratio*100),leaderScore};
}
