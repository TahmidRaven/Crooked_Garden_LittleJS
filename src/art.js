// Optional local art with procedural fallbacks. No runtime CDN or third-party requests.
import { BUG_ART_FILES, warmHunterPixels } from './bug-flight.js';
const files={...BUG_ART_FILES,foliage:'foliage.png'};
export const art={};
export const artReady=Promise.all(Object.entries(files).map(async([key,file])=>{
  const image=new Image();
  image.src=`${import.meta.env.BASE_URL}assets/art/${file}`;
  try{
    await image.decode();
    if(key==='foliage'){
      const tinted=document.createElement('canvas');tinted.width=image.width;tinted.height=image.height;
      const c=tinted.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#80956c';c.fillRect(0,0,tinted.width,tinted.height);
      art[key]=tinted;
    }else if(key.startsWith('flyFlight')){
      const warm=document.createElement('canvas');warm.width=image.width;warm.height=image.height;
      const c=warm.getContext('2d');c.drawImage(image,0,0);
      const pixels=c.getImageData(0,0,warm.width,warm.height);pixels.data.set(warmHunterPixels(pixels.data));c.putImageData(pixels,0,0);art[key]=warm;
    }else art[key]=image;
  }
  catch{art[key]=null;}
}));
export const artStatus=()=>Object.fromEntries(Object.keys(files).map(key=>[key,Boolean(art[key]?.width)]));
