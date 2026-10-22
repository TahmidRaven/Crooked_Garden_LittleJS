// Optional local art with procedural fallbacks. No runtime CDN or third-party requests.
import { BUG_ART_FILES } from './bug-flight.js';
const files={...BUG_ART_FILES,foliage:'foliage.png'};
export const art={};
export const artReady=Promise.all(Object.entries(files).map(async([key,file])=>{
  const image=new Image();
  image.src=`${import.meta.env.BASE_URL}assets/art/${file}`;
  try{
    await image.decode();
    if(key==='foliage'||key.endsWith('Stunned')){
      const tinted=document.createElement('canvas');tinted.width=image.width;tinted.height=image.height;
      const c=tinted.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='source-in';c.fillStyle=key==='foliage'?'#80956c':'#8b9277';c.fillRect(0,0,tinted.width,tinted.height);
      art[key]=tinted;
    }else art[key]=image;
  }
  catch{art[key]=null;}
}));
export const artStatus=()=>Object.fromEntries(Object.keys(files).map(key=>[key,Boolean(art[key]?.width)]));
