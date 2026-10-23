// Body/soil anchor from scripts/render-flower-pot.mjs; changing this never moves the physics root.
export const POT_SPRITE={width:512,height:462,anchor:{x:256,y:112.02576378247556},worldWidth:54};
export function potPlacement(root){
  const scale=POT_SPRITE.worldWidth/POT_SPRITE.width;
  return {x:root.x-POT_SPRITE.anchor.x*scale,y:root.y-POT_SPRITE.anchor.y*scale,width:POT_SPRITE.width*scale,height:POT_SPRITE.height*scale,scale};
}
