// One cached forest strip; scrolling changes only its blit offset, not the composite.
export const FOREST_THEME={base:'#0c1122',scrim:'rgba(6,14,22,.18)',edge:'rgba(6,14,22,.34)'};
export const FOREST_SCROLL_SPEED=6;
// Grass baseline in the prepared 864x410 forest image.
export const FOREST_GROUND_RATIO=377/410;

export function forestOffset(tileWidth,viewportWidth,seconds,reducedMotion=false){
  const start=(tileWidth-viewportWidth)/2;
  return reducedMotion?start:((start+seconds*FOREST_SCROLL_SPEED)%tileWidth+tileWidth)%tileWidth;
}

export function forestCover(width,height,imageWidth,imageHeight){
  const scale=Math.max(width/imageWidth,height/imageHeight);
  return {x:(width-imageWidth*scale)/2,y:(height-imageHeight*scale)/2,width:imageWidth*scale,height:imageHeight*scale};
}

export function forestPlacement(width,height,imageWidth,imageHeight,floorY=null){
  const cover=forestCover(width,height,imageWidth,imageHeight),tileWidth=Math.ceil(cover.width);
  const scaledHeight=imageHeight*tileWidth/imageWidth;
  const initialY=(height-scaledHeight)/2,naturalFloor=initialY+scaledHeight*FOREST_GROUND_RATIO;
  const lift=Number.isFinite(floorY)?Math.max(0,naturalFloor-floorY):0;
  return {width:tileWidth,height:scaledHeight,y:initialY-lift,floorY:naturalFloor-lift};
}

export function createForestBackgroundRenderer(createCanvas=()=>document.createElement('canvas')){
  let cache=null,lastImage=null,lastWidth=0,lastHeight=0,lastFloor=null;
  return (c,view,image,{seconds=0,reducedMotion=false,floorY=null}={})=>{
    if(!image){c.fillStyle=FOREST_THEME.base;c.fillRect(0,0,view.width,view.height);return;}
    const width=Math.max(1,Math.round(view.width)),height=Math.max(1,Math.round(view.height));
    if(!cache||lastImage!==image||lastWidth!==width||lastHeight!==height||lastFloor!==floorY){
      const placement=forestPlacement(width,height,image.width,image.height,floorY),tileWidth=placement.width;
      cache??=createCanvas();cache.width=tileWidth;cache.height=height;
      const background=cache.getContext('2d');
      background.imageSmoothingEnabled=false;
      background.fillStyle=FOREST_THEME.base;background.fillRect(0,0,tileWidth,height);
      background.drawImage(image,0,placement.y,tileWidth,placement.height);
      // Keep the original cool forest colours, with a quiet value range behind gameplay.
      background.fillStyle=FOREST_THEME.scrim;background.fillRect(0,0,tileWidth,height);
      const shade=background.createLinearGradient(0,0,0,height);
      shade.addColorStop(0,FOREST_THEME.edge);shade.addColorStop(.3,'transparent');
      shade.addColorStop(.7,'transparent');shade.addColorStop(1,FOREST_THEME.edge);
      background.fillStyle=shade;background.fillRect(0,0,tileWidth,height);
      lastImage=image;lastWidth=width;lastHeight=height;lastFloor=floorY;
    }
    const offset=forestOffset(cache.width,view.width,seconds,reducedMotion);
    c.save();c.imageSmoothingEnabled=false;
    c.drawImage(cache,-offset,0,cache.width,view.height);
    if(offset+view.width>cache.width)c.drawImage(cache,cache.width-offset,0,cache.width,view.height);
    c.restore();
  };
}
