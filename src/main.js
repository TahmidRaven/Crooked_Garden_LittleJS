import './style.css';
import './menu.css';
import './simple-ui.css';
import './help.css';
import * as L from 'littlejsengine';
import { LEVELS, MAX_WATER, rewind, bloomCount } from './game.js';
import { createArcade, tickArcade, queueBurst, bugsAt, BURST_COST } from './arcade.js';
import { artReady, artStatus } from './art.js';
import { fitViewport } from './view.js';
import { renderScene } from './scene.js';
import { createFailureAudio } from './failure-audio.js';
import { createJoystick } from './joystick.js';
import { createWavedash, createRunProgress } from './wavedash.js';
import { createGlobalLeaderboard } from './global-leaderboard.js';
import { createRunResources,REWIND_PENALTY,RETRY_PENALTY } from './run-resources.js';
import { scoreRating } from './score-rating.js';
import { createUIAudio,bindButtonAudio } from './ui-audio.js';
import { createIdleGuide } from './drag-guide.js';

const $=id=>document.getElementById(id);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchControls=matchMedia('(pointer:coarse)').matches;
let garden=createArcade(),light={x:400,y:450},phase='loading',ticks=0,muted=false;
let particles=[],popups=[],bank=0,best=0;
let helpReturn='title';
const wavedash=createWavedash();
const globalLeaderboard=createGlobalLeaderboard();
let runProgress=createRunProgress(),leaderboardReturn='title',leaderboardRequest=0,scoreRequest=0,pendingScore=null;
let leaderboardSource='global',runSeconds=0,pendingGlobalRun=null,globalSubmitRequest=0;
let shareExpanded=false;
let ratingScore=null;
let ratingStarsShown=0;
const dragGuide=createIdleGuide();
let backgroundSeconds=0;
let globalBestRequest=0;
let runResources=createRunResources(),rewindNotice=0,retryNotice=0;
let view=fitViewport(innerWidth,innerHeight,devicePixelRatio||1);
try{best=Number(localStorage.getItem('crooked-garden-best-v2'))||0;}catch{}
const music=new Audio(`${import.meta.env.BASE_URL}assets/calm-theme.ogg`);music.loop=true;music.volume=.2;
const chime=new L.Sound([.28,0,640,.01,.08,.2,1,1.4,0,0,220,.08]);
const catchChime=new L.Sound([.18,0,980,.01,.12,.32,1,1.5,0,0,160,.1]);
const comboChime=new L.Sound([.2,0,1320,.01,.15,.4,1,1.6,0,0,240,.1]);
const failureAudio=createFailureAudio(L.Sound);
const uiAudio=createUIAudio({baseUrl:import.meta.env.BASE_URL,isMuted:()=>muted});
bindButtonAudio(document,uiAudio,{isReady:()=>phase!=='loading'});

const perfect=()=>bloomCount(garden)===garden.level.flowers.length;
const stageScore=()=>bloomCount(garden)*300+garden.swatted*100+garden.captureScore+garden.collected.filter(Boolean).length*50+(perfect()?Math.ceil(garden.water):0);
const totalScore=()=>runResources.score(bank+stageScore());
function focusGame(){$('game-root').focus({preventScroll:true});}
const joystick=createJoystick($('joystick'),{surface:$('game-root'),enabled:()=>phase==='playing',onStart:focusGame});
function begin(stage=0,score=0,{freshRun=stage===0}={}){
  if(freshRun){runProgress=createRunProgress();runSeconds=0;runResources=createRunResources();}
  rewindNotice=0;retryNotice=0;
  pendingGlobalRun=null;globalSubmitRequest++;$('global-share').disabled=false;$('global-score-status').textContent='';
  shareExpanded=false;
  ratingScore=null;globalBestRequest++;resetResultRating();
  scoreRequest++;pendingScore=null;$('score-status').textContent='';$('score-retry').hidden=true;
  garden=createArcade({stage});garden.rewinds=0;bank=score;light={x:400,y:450};
  dragGuide.reset(garden,{immediate:freshRun&&stage===0});
  joystick.reset();particles=[];popups=[];phase='playing';L.inputClear();updateUI();focusGame();if(!muted)music.play().catch(()=>{});
}
function retry(){
  if(!['playing','paused','result'].includes(phase)||!runResources.useRetry())return;
  begin(garden.index,bank,{freshRun:false});retryNotice=120;
  popup(`RETRY −${RETRY_PENALTY} PTS`,'#f0b18c');updateUI();
}
function home(){garden=createArcade();phase='title';particles=[];popups=[];bank=0;updateUI();$('play').focus({preventScroll:true});}
function pause(){if(phase==='playing'){phase='paused';updateUI();$('resume').focus({preventScroll:true});}}
function resume(){if(phase==='paused'){phase='playing';L.inputClear();updateUI();focusGame();if(!muted)music.play().catch(()=>{});}}
let helpMotion=!reducedMotion;
function updateHelpMotion(){
  const playing=phase==='help'&&helpMotion;
  for(const image of $('help-screen').querySelectorAll('[data-motion]')){
    const source=playing?image.dataset.motion:image.dataset.still;
    if(image.getAttribute('src')!==source)image.setAttribute('src',source);
  }
  $('help-motion').textContent=helpMotion?'Pause clips':'Play clips';
  $('help-motion').setAttribute('aria-pressed',String(helpMotion));
}
function openHelp(){
  if(!['title','paused'].includes(phase))return;
  helpReturn=phase;phase='help';updateUI();updateHelpMotion();$('help-screen').querySelector('.help-scroll').scrollTop=0;$('help-back').focus({preventScroll:true});
}
function closeHelp(){
  if(phase!=='help')return;
  phase=helpReturn;updateUI();updateHelpMotion();$(helpReturn==='title'?'how-to-play':'pause-help').focus({preventScroll:true});
}
function openCredits(){
  if(phase!=='title')return;
  phase='credits';updateUI();$('asset-credits-screen').querySelector('.help-scroll').scrollTop=0;$('credits-back').focus({preventScroll:true});
}
function closeCredits(){
  if(phase!=='credits')return;
  phase='title';updateUI();$('asset-credits').focus({preventScroll:true});
}
function resetResultRating(){
  ratingStarsShown=0;$('result-rating').hidden=true;
  for(const star of $('rating-stars').children)star.classList.remove('star-pop','earned');
}
function displayGlobalBest(entries){
  const leader=entries===null?null:entries.reduce((highest,e)=>Math.max(highest,e.score),0);
  $('best-label').textContent=leader===null?'—':String(leader);
  $('global-best-stat').title=entries===null?'Leaderboard unavailable.':'Highest submitted score across all players.';
  const rating=ratingScore===null?null:scoreRating(ratingScore,leader);
  $('result-rating').hidden=!rating;
  if(rating){
    for(const [i,star] of [...$('rating-stars').children].entries()){
      const earned=i<rating.stars;
      star.src=`${import.meta.env.BASE_URL}assets/ui/${earned?'rating-star.svg':'rating-star-empty.svg'}`;
      star.classList.toggle('earned',earned);
      if(!earned)star.classList.remove('star-pop');
      else if(i>=ratingStarsShown){star.style.animationDelay=`${(i-ratingStarsShown)*130}ms`;star.classList.add('star-pop');}
    }
    ratingStarsShown=Math.max(ratingStarsShown,rating.stars);
    $('rating-caption').textContent=`${rating.percent}% of global best`;
    $('result-rating').setAttribute('aria-label',`${rating.stars} of 3 stars: ${rating.percent}% of the global leader's score. This is a score comparison, not a rank.`);
    $('result-rating').title=`${ratingScore} / ${leader}. One star at 50%, two at 75%, three at 100%. Not a rank.`;
  }
}
async function refreshGlobalBest(){
  const request=++globalBestRequest;
  $('best-label').textContent='…';
  $('result-rating').hidden=true;
  const entries=await globalLeaderboard.getScores();
  if(request===globalBestRequest)displayGlobalBest(entries);
}
async function showLeaderboard(){
  if(!['title','result','leaderboard'].includes(phase))return;
  if(phase!=='leaderboard')leaderboardReturn=phase;
  phase='leaderboard';updateUI();$('leaderboard-back').focus({preventScroll:true});
  const request=++leaderboardRequest;
  const global=leaderboardSource==='global';
  $('leaderboard-title').textContent=global?'GLOBAL GARDEN MASTERS':'WAVEDASH MASTERS';
  $('leaderboard-platform').textContent=global?'All platforms — Top 10':'Wavedash — Top 10';
  $('leaderboard-global').setAttribute('aria-pressed',String(global));
  $('leaderboard-wavedash').setAttribute('aria-pressed',String(!global));
  $('leaderboard-entries').replaceChildren();$('leaderboard-status').textContent='Loading Garden Masters…';
  $('leaderboard-refresh').disabled=true;
  const entries=await (global?globalLeaderboard:wavedash).getScores();
  if(request!==leaderboardRequest||phase!=='leaderboard')return;
  if(global){globalBestRequest++;displayGlobalBest(entries);}
  $('leaderboard-refresh').disabled=false;
  $('leaderboard-status').textContent=entries===null?'Could not load scores. Please try again.':entries.length?'Completed three-garden runs — highest score wins.':'No scores yet. Clear all three gardens to set the first!';
  for(const entry of entries||[]){
    const row=document.createElement('li');
    for(const text of [`#${entry.rank}`,entry.name,String(entry.score)]){
      const cell=document.createElement('span');cell.textContent=text;row.append(cell);
    }
    $('leaderboard-entries').append(row);
  }
}
async function shareGlobalScore(){
  if(!pendingGlobalRun||$('global-share').disabled)return;
  const request=++globalSubmitRequest;
  $('global-share').disabled=true;$('global-score-status').textContent='Sharing global score…';
  const result=await globalLeaderboard.postScore(pendingGlobalRun,$('global-player-name').value);
  if(request!==globalSubmitRequest)return;
  $('global-score-status').textContent=result.message;
  $('global-share').disabled=result.ok;
  if(result.ok)void refreshGlobalBest();
}
function closeLeaderboard(){
  if(phase!=='leaderboard')return;
  leaderboardRequest++;phase=leaderboardReturn;updateUI();
  $(leaderboardReturn==='title'?'title-leaderboard':'result-leaderboard').focus({preventScroll:true});
}
async function uploadRunScore(score){
  const request=++scoreRequest;pendingScore=score;
  $('score-status').textContent='Saving Wavedash score…';$('score-retry').hidden=true;
  const sent=await wavedash.postScore(score);
  if(request!==scoreRequest)return;
  $('score-status').textContent=sent?'Run submitted to Wavedash.':'Score upload failed.';
  $('score-retry').hidden=sent;
}
function doRewind(){
  if(!['playing','result'].includes(phase)||perfect()||garden.path.length<2||!runResources.useRewind())return;
  rewind(garden,140);garden.grace=.9;garden.burst=0;garden.queued=false;garden.rewinds=(garden.rewinds||0)+1;
  joystick.reset();phase='playing';retryNotice=0;rewindNotice=120;popup(`REWIND −${REWIND_PENALTY} PTS`,'#f0b18c');updateUI();focusGame();
}
function burst(){if(phase==='playing'){queueBurst(garden);updateUI();}}
function popup(text,color){const tip=garden.path.at(-1);popups.push({x:tip.x,y:tip.y-25,text,color,life:1.1});}
function feedback(event){
  if(!muted)chime.play();
  const tip=garden.path.at(-1),color=event==='dew'?'#9beff2':event==='swat'?'#ffe19e':'#d2ee98';
  popup(event==='dew'?'+260 WATER':event==='swat'?'STUN!':event==='won'?'GARDEN CLEARED!':'BLOOM!',color);
  for(let i=0;i<(reducedMotion?0:event==='won'?65:20);i++)particles.push({x:tip.x,y:tip.y,vx:(Math.random()-.5)*3.4,vy:-Math.random()*3,life:1,color,size:2+Math.random()*2});
}
function captureFeedback(){
  const capture=garden.lastCapture;if(!capture)return;
  if(!muted)(capture.count>1?comboChime:catchChime).play();
  const x=capture.bugs.reduce((n,p)=>n+p.x,0)/capture.count,y=capture.bugs.reduce((n,p)=>n+p.y,0)/capture.count;
  popups.push({x,y:y-25,text:capture.count===1?'CAUGHT!':capture.count===2?'DOUBLE CATCH!':'TRIPLE CATCH!',color:'#ffe6a3',life:1.4});
  popups.push({x,y:y+1,text:`+${Math.round(capture.water)} WATER  +${capture.points}`,color:'#c6f49b',life:1.4});
  const tip=garden.path.at(-1);
  for(const bug of capture.bugs)for(let i=0;i<(reducedMotion?0:28);i++)particles.push({x:bug.x,y:bug.y,vx:(tip.x-bug.x)*.025+(Math.random()-.5)*3,vy:(tip.y-bug.y)*.025-Math.random()*2,life:1,color:i%2?'#d3f49b':'#ffe09a',size:2+Math.random()*2});
}
function showResult(){
  phase='result';const cleared=perfect(),last=garden.index===LEVELS.length-1;
  shareExpanded=false;
  ratingScore=cleared&&last?totalScore():null;resetResultRating();
  if(!cleared)failureAudio.play(garden.endedBy==='water'?'water':garden.endedBy==='bug'?'bug':'terrain',{muted});
  if(cleared){best=Math.max(best,totalScore());try{localStorage.setItem('crooked-garden-best-v2',String(best));}catch{}}
  if(cleared){
    runSeconds+=garden.clock;
    const completedScore=runProgress.clear(garden.index,totalScore());
    if(completedScore!==null){
      wavedash.unlock('THE_GARDEN_LIVES');
      pendingGlobalRun={runId:crypto.randomUUID(),score:completedScore,completedGardens:3,durationSeconds:Math.ceil(runSeconds)};
      if(wavedash.active)void uploadRunScore(completedScore);
    }
  }
  $('result-tag').hidden=!cleared;
  $('result-tag').textContent=`Garden ${garden.index+1} of ${LEVELS.length}`;
  $('result-title').textContent=cleared?(last?'The garden lives':'Garden restored'):'Withered';
  $('result-copy').hidden=cleared;
  $('result-copy').textContent=garden.endedBy==='bug'?'Caught by the swarm':garden.endedBy==='water'?'Out of water':'Stopped by the roots';
  $('result-score').textContent=totalScore();
  $('global-best-stat').hidden=!(cleared&&last);
  if(cleared&&last)void refreshGlobalBest();
  const canRewind=!cleared&&garden.path.length>=2&&runResources.remaining>0;
  $('next-label').textContent=cleared?(last?'Play again':'Continue'):runResources.retriesLeft?'Retry':'New Run';
  $('next-detail').hidden=cleared||!runResources.retriesLeft;
  $('next-detail').textContent=`${runResources.retriesLeft} left −${RETRY_PENALTY} pts`;
  $('next').className=canRewind?'menu-button':'menu-button menu-primary';
  $('result-undo').hidden=!canRewind;
  updateUI();$(canRewind?'result-undo':'next').focus({preventScroll:true});
}
function updateUI(){
  if(phase!=='playing')joystick.reset();
  $('title-screen').hidden=phase!=='title';$('pause-screen').hidden=phase!=='paused';$('result-screen').hidden=phase!=='result';
  $('help-screen').hidden=phase!=='help';
  $('asset-credits-screen').hidden=phase!=='credits';
  $('leaderboard-screen').hidden=phase!=='leaderboard';
  $('title-leaderboard').hidden=false;
  $('result-leaderboard').hidden=!perfect();
  $('leaderboard-wavedash').hidden=!wavedash.active;
  $('global-share-panel').hidden=!pendingGlobalRun||!shareExpanded;
  $('global-share-toggle').hidden=!pendingGlobalRun||shareExpanded;
  $('global-share-toggle').setAttribute('aria-expanded',String(shareExpanded));
  $('score-status').hidden=!wavedash.active||!$('score-status').textContent;
  $('help-back').textContent=helpReturn==='title'?'← Back to menu':'← Back to pause';
  $('help-play').textContent=helpReturn==='title'?'Start Game':'Resume';
  $('hud').hidden=phase!=='playing';$('play-controls').hidden=phase!=='playing';
  $('game-root').inert=phase!=='playing';
  // LittleJS otherwise cancels document-level wheel/touch events over HTML menus.
  L.setInputPreventDefault(phase==='playing');
  $('game').dataset.phase=phase;
  $('water').max=MAX_WATER;$('water').value=garden.water;$('water').classList.toggle('low',garden.water<150);$('water-label').textContent=Math.ceil(garden.water);
  $('score-label').textContent=String(totalScore()).padStart(4,'0');$('stage-label').textContent=`GARDEN ${garden.index+1} / ${LEVELS.length}`;
  for(let i=0;i<3;i++){
    const token=$(`flower-${i}`);token.classList.toggle('saved',garden.bloomed[i]);token.style.setProperty('--flower',garden.level.flowers[i].color);
    token.setAttribute('aria-label',`${garden.level.flowers[i].name}: ${garden.bloomed[i]?'restored':'dormant'}`);
  }
  $('flower-icons').setAttribute('aria-label',`${bloomCount(garden)} of 3 flowers restored`);
  const canPlay=phase==='playing';
  $('boost').disabled=!canPlay||garden.cooldown>0||garden.burst>0||garden.water<=BURST_COST;
  $('boost').setAttribute('aria-pressed',String(garden.queued||garden.burst>0));
  $('burst-label').textContent=garden.burst>0?'PROTECTED':garden.cooldown>0?`${garden.cooldown.toFixed(1)}s`:garden.queued?'ARMED':'BURST';
  $('burst-detail').textContent=garden.queued?'HOLD TO RELEASE':garden.cooldown>0?'RECHARGING':`${touchControls?'TAP':'SHIFT'} 30 WATER`;
  $('undo').disabled=!canPlay||garden.path.length<2||!runResources.remaining;
  $('rewind-label').textContent=String(runResources.remaining);
  $('undo').setAttribute('aria-label',`Rewind vine: ${runResources.remaining} left this run; costs ${REWIND_PENALTY} points`);
  $('undo').title=`Rewind (Z) ${runResources.remaining} left −${REWIND_PENALTY} points`;
  $('result-undo-detail').textContent=`${runResources.remaining} left −${REWIND_PENALTY} pts`;
  const retries=runResources.retriesLeft;
  $('retry-label').textContent=String(retries);
  $('restart').disabled=!canPlay||!retries;
  $('restart').title=`Retry garden (R) ${retries} left this run −${RETRY_PENALTY} points`;
  $('restart').setAttribute('aria-label',`Retry this garden: ${retries} left for the entire run; costs ${RETRY_PENALTY} points`);
  $('pause-retry').disabled=!retries;
  $('pause-retry-detail').textContent=`${retries} left −${RETRY_PENALTY} pts`;
  $('pause').disabled=!canPlay;
  $('state-label').textContent=retryNotice>0?`−${RETRY_PENALTY} PTS — ${retries} RETRIES LEFT THIS RUN`:rewindNotice>0?`−${REWIND_PENALTY} PTS — ${runResources.remaining} REWINDS LEFT THIS RUN`:garden.lastCapture&&garden.clock-garden.lastCapture.clock<1.4?`${garden.lastCapture.count>1?'COMBO CATCH!':'CAUGHT!'} +${Math.round(garden.lastCapture.water)} WATER — ${garden.lastCapture.refund} REFUND`:garden.loopHint?`CLOSE THE LOOP — ${garden.loopHint.count} BUG${garden.loopHint.count===1?'':'S'} INSIDE`:garden.burst>0?'PROTECTED — STUN A BUG, THEN LOOP IT':garden.queued?'BURST ARMED — DRAG TO GROW':garden.water<150?'LOW WATER — FIND BLUE DEW':garden.started?'GROW LOOPS TO CATCH BUGS — BLOOM ALL THREE':'TOUCH OR CLICK ANYWHERE — DRAG TO GROW';
}
$('play').onclick=()=>begin();$('resume').onclick=resume;$('pause').onclick=pause;
$('restart').onclick=retry;$('pause-retry').onclick=retry;$('undo').onclick=doRewind;$('result-undo').onclick=doRewind;
$('home').onclick=home;$('result-home').onclick=home;
// A secondary touch does not generate a click while the steering thumb is down.
$('boost').addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!$('boost').disabled){e.preventDefault();burst();}});
$('boost').onclick=e=>{if(e.pointerType!=='touch')burst();};
$('how-to-play').onclick=openHelp;$('pause-help').onclick=openHelp;$('help-back').onclick=closeHelp;
$('help-motion').onclick=()=>{helpMotion=!helpMotion;updateHelpMotion();};
$('help-play').onclick=()=>{if(helpReturn==='title')begin();else{phase='paused';resume();}updateHelpMotion();};
$('asset-credits').onclick=openCredits;$('credits-back').onclick=closeCredits;$('credits-done').onclick=closeCredits;
$('title-leaderboard').onclick=$('result-leaderboard').onclick=$('leaderboard-refresh').onclick=showLeaderboard;
$('leaderboard-back').onclick=closeLeaderboard;
$('leaderboard-global').onclick=()=>{leaderboardSource='global';void showLeaderboard();};
$('leaderboard-wavedash').onclick=()=>{if(wavedash.active){leaderboardSource='wavedash';void showLeaderboard();}};
$('global-share').onclick=shareGlobalScore;
$('global-share-toggle').onclick=()=>{if(phase==='result'&&pendingGlobalRun){shareExpanded=true;updateUI();$('global-player-name').focus({preventScroll:true});}};
$('score-retry').onclick=()=>{if(pendingScore!==null)void uploadRunScore(pendingScore);};
$('next').onclick=()=>{if(perfect()){if(garden.index+1<LEVELS.length)begin(garden.index+1,bank+stageScore());else begin();}else if(runResources.retriesLeft)retry();else begin();};
$('music').onclick=async()=>{
  muted=!muted;
  if(muted)uiAudio.stop();
  if(muted)music.pause();else try{await music.play();}catch{muted=true;uiAudio.stop();}
  $('music').setAttribute('aria-pressed',String(!muted));$('music').setAttribute('aria-label',muted?'Enable sound':'Mute sound');
  $('music').querySelector('img').src=`${import.meta.env.BASE_URL}assets/ui/${muted?'hud-music-muted':'hud-music'}.svg`;
};
$('fullscreen').disabled=!document.fullscreenEnabled;
function updateFullscreenIcon(){
  const active=!!document.fullscreenElement,label=active?'Exit fullscreen':'Enter fullscreen';
  $('fullscreen').querySelector('img').src=`${import.meta.env.BASE_URL}assets/ui/${active?'hud-windowed':'hud-fullscreen'}.svg`;
  $('fullscreen').setAttribute('aria-label',label);$('fullscreen').title=label;
}
document.addEventListener('fullscreenchange',updateFullscreenIcon);
updateFullscreenIcon();
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game').requestFullscreen();}catch{$('fullscreen').setAttribute('aria-label','Fullscreen unavailable');}};
function resize(){
  const r=$('game-root').getBoundingClientRect();view=fitViewport(r.width,r.height,devicePixelRatio||1);
  L.setCanvasFixedSize(L.vec2(Math.round(view.width*view.dpr),Math.round(view.height*view.dpr)));
}
async function init(){
  // The native LittleJS splash runs before init; keep loading visible until local art is decoded.
  await Promise.all([artReady,document.fonts.load('400 14px "Kaph"').catch(()=>[]),document.fonts.load('italic 400 14px "Kaph"').catch(()=>[])]);
  const canvas=L.mainCanvas;canvas.style.touchAction='none';canvas.style.transform='none';
  window.addEventListener('blur',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();music.pause();}else if(!muted&&phase==='playing')music.play().catch(()=>{});});
  $('game-root').addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
  window.addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown'].includes(e.code)&&['title','paused','result'].includes(phase)&&document.activeElement?.tagName!=='INPUT'){
      const panel=$(phase==='title'?'title-screen':phase==='paused'?'pause-screen':'result-screen');
      const items=[...panel.querySelectorAll('button')].filter(el=>!el.disabled&&el.getClientRects().length);
      if(items.length){e.preventDefault();const index=items.indexOf(document.activeElement);const next=index<0?(e.code==='ArrowDown'?0:items.length-1):(index+(e.code==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus();}
    }
    if(e.code==='Escape'){e.preventDefault();if(e.repeat)return;if(phase==='leaderboard')closeLeaderboard();else if(phase==='credits')closeCredits();else if(phase==='help')closeHelp();else if(phase==='playing')pause();else if(phase==='paused')resume();}
    if(e.code==='Tab'&&phase!=='playing'){
      const panel=$(phase==='title'?'title-screen':phase==='paused'?'pause-screen':phase==='help'?'help-screen':phase==='credits'?'asset-credits-screen':phase==='leaderboard'?'leaderboard-screen':'result-screen');
      const items=[...panel.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex="0"]')].filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
  $('flower-icons').replaceChildren(...garden.level.flowers.map((f,i)=>{const token=document.createElement('span');token.id=`flower-${i}`;token.className='flower-token';token.textContent='✿';return token;}));
  new ResizeObserver(resize).observe($('game-root'));resize();phase='title';$('startup-credit').hidden=true;$('game').setAttribute('aria-busy','false');wavedash.init();leaderboardSource=wavedash.active?'wavedash':'global';$('global-player-name').value=globalLeaderboard.getName();updateUI();$('play').focus({preventScroll:true});
}
function keyboardGrowing(){return document.activeElement===$('game-root')&&L.keyIsDown('KeyG');}
function update(){
  ticks++;
  if(phase==='playing'&&document.activeElement===$('game-root')){
    if(L.keyWasPressed('KeyR'))retry();
    if(L.keyWasPressed('KeyZ'))doRewind();
    if(L.keyWasPressed('Space'))pause();
    if(L.keyWasPressed('ShiftLeft')||L.keyWasPressed('ShiftRight'))burst();
    if(L.keyIsDown('ArrowLeft'))light.x=Math.max(35,light.x-6);if(L.keyIsDown('ArrowRight'))light.x=Math.min(565,light.x+6);
    if(L.keyIsDown('ArrowUp'))light.y=Math.max(35,light.y-6);if(L.keyIsDown('ArrowDown'))light.y=Math.min(660,light.y+6);
  }
  if(phase==='playing'){
    rewindNotice=Math.max(0,rewindNotice-1);
    retryNotice=Math.max(0,retryNotice-1);
    const stick=joystick.vector;
    dragGuide.update(garden,{growing:joystick.active?stick.growing:keyboardGrowing()});
    if(stick.growing){const tip=garden.path.at(-1);light={x:tip.x+stick.x*100,y:tip.y+stick.y*100};}
    const captureSerial=garden.captureSerial;
    const event=tickArcade(garden,light,{growing:joystick.active?stick.growing:keyboardGrowing()});
    if(bloomCount(garden)>0)wavedash.unlock('FIRST_BLOOM');
    if(garden.captures>0)wavedash.unlock('BUG_GARDENER');
    if(garden.maxCombo>=2)wavedash.unlock('DOUBLE_TROUBLE');
    if(garden.captureSerial!==captureSerial){captureFeedback();updateUI();}
    if(['dew','flower','won','swat'].includes(event))feedback(event);
    if(['blocked','dry','won'].includes(event))showResult();
  }
  if(!['paused','help','credits','leaderboard'].includes(phase)){
    backgroundSeconds+=1/60;
    particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.025;p.life-=.018;});
    popups=popups.filter(p=>p.life>0);popups.forEach(p=>{if(!reducedMotion)p.y-=.5;p.life-=1/60;});
  }
  if(ticks%5===0)updateUI();
}
L.setGLEnable(false);L.setCanvasPixelated(false);L.setShowSplashScreen(true);L.setTouchGamepadEnable(false);
L.setCanvasFixedSize(L.vec2(Math.round(view.width*view.dpr),Math.round(view.height*view.dpr)));
L.engineInit(init,update,()=>{},()=>renderScene(L.mainContext,{garden,light,view,ticks,phase,reducedMotion,particles,popups,dragGuide:dragGuide.route,dragGuideSeconds:dragGuide.seconds,backgroundSeconds}),()=>{},[],$('game-root'));
// CSS imports have run and the engine owns the canvas; it is now safe to reveal startup UI.
document.documentElement.classList.add('game-styled');
window.crookedGarden={getState:()=>({phase,stage:garden.index,seed:garden.seed,status:garden.status,tip:{...garden.path.at(-1)},water:garden.water,flowers:[...garden.bloomed],dew:[...garden.collected],points:garden.path.length,bugs:bugsAt(garden),burst:garden.burst,cooldown:garden.cooldown,queued:garden.queued,swatted:garden.swatted,captures:garden.captures,captured:[...garden.captured],captureScore:garden.captureScore,maxCombo:garden.maxCombo,lastCapture:garden.lastCapture?{count:garden.lastCapture.count,water:garden.lastCapture.water,points:garden.lastCapture.points,loopLength:garden.lastCapture.loopLength,refund:garden.lastCapture.refund}:null,clock:garden.clock,endedBy:garden.endedBy,score:totalScore(),rewindsLeft:runResources.remaining,rewindPenalty:runResources.rewindPenalty,retriesLeft:runResources.retriesLeft,retryPenalty:runResources.retryPenalty,best,view:{...view},art:artStatus()})};
