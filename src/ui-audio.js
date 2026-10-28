export const UI_AUDIO={hover:{file:'ui-hover.ogg',volume:.16},select:{file:'ui-select.ogg',volume:.23}};

export function createUIAudio({baseUrl='',createAudio=src=>new Audio(src),isMuted=()=>false,now=()=>performance.now()}={}){
  const pools=Object.fromEntries(Object.entries(UI_AUDIO).map(([kind,config])=>[kind,[0,1].map(()=>{
    const audio=createAudio(`${baseUrl}assets/audio/${config.file}`);audio.preload='auto';audio.volume=config.volume;return audio;
  })]));
  const indices={hover:0,select:0};let lastHover=-Infinity;
  const stop=()=>{for(const pool of Object.values(pools))for(const audio of pool){try{audio.pause();audio.currentTime=0;}catch{}}};
  return {
    play(kind){
      if(isMuted()||!Object.hasOwn(pools,kind))return false;
      if(kind==='hover'){const time=now();if(time-lastHover<100)return false;lastHover=time;}
      const audio=pools[kind][indices[kind]++%2];
      try{audio.pause();audio.currentTime=0;audio.play()?.catch(()=>{});return true;}catch{return false;}
    },
    stop
  };
}

export function bindButtonAudio(root,audio,{isReady=()=>true}={}){
  let interacted=false,keyboardNavigation=false,disposed=false;
  const view=root.defaultView;
  const enabled=()=>!disposed&&isReady()&&root.visibilityState!=='hidden'&&(interacted||view?.navigator?.userActivation?.hasBeenActive);
  const buttonFor=target=>{
    const button=target?.closest?.('button');
    return button&&!button.disabled&&button.closest('#game')&&button.getClientRects().length?button:null;
  };
  const pointerDown=e=>{
    if(!e.isTrusted)return;interacted=true;keyboardNavigation=false;
    const button=buttonFor(e.target);
    // Secondary touch presses may never produce a click (e.g. steering + Burst).
    if(e.pointerType==='touch'&&button?.dataset.uiPressSound==='true'&&isReady())queueMicrotask(()=>{if(enabled())audio.play('select');});
  };
  const keyDown=e=>{
    if(!e.isTrusted)return;interacted=true;
    keyboardNavigation=e.code==='Tab'||(['ArrowUp','ArrowDown'].includes(e.code)&&root.activeElement?.tagName==='BUTTON');
  };
  const hover=e=>{
    if(!e.isTrusted||e.pointerType==='touch'||!enabled())return;
    const button=buttonFor(e.target);
    if(button&&(!e.relatedTarget||!button.contains(e.relatedTarget)))audio.play('hover');
  };
  const focus=e=>{if(!keyboardNavigation)return;keyboardNavigation=false;if(enabled()&&buttonFor(e.target))audio.play('hover');};
  const select=e=>{
    const button=buttonFor(e.target);
    if(!e.isTrusted||!isReady()||!button||e.pointerType==='touch'&&button.dataset.uiPressSound==='true')return;
    interacted=true;keyboardNavigation=false;
    // Check mute after the button's handler, so mute is silent and unmute confirms.
    queueMicrotask(()=>{if(enabled())audio.play('select');});
  };
  const visibility=()=>{if(root.visibilityState==='hidden')audio.stop();};
  const events=[['pointerdown',pointerDown,true],['keydown',keyDown,true],['pointerover',hover,true],['focusin',focus,true],['click',select,true],['visibilitychange',visibility,false]];
  for(const [name,handler,capture] of events)root.addEventListener(name,handler,capture);
  view?.addEventListener('blur',audio.stop);
  return ()=>{disposed=true;for(const [name,handler,capture] of events)root.removeEventListener(name,handler,capture);view?.removeEventListener('blur',audio.stop);audio.stop();};
}
