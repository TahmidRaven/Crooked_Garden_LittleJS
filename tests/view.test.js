import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitViewport,screenToGarden} from '../src/view.js';

test('world input maps correctly after resize, orientation change, and high-DPI scaling',()=>{
  for(const [w,h] of [[320,568],[390,844],[844,390],[568,320],[1440,900]]){
    const v=fitViewport(w,h,3);assert.equal(v.dpr,2);
    for(const p of [{x:300,y:635},{x:430,y:550},{x:205,y:390}]){
      const actual=screenToGarden(v,v.x+p.x*v.scale,v.y+p.y*v.scale);
      assert.ok(Math.abs(actual.x-p.x)<.001&&Math.abs(actual.y-p.y)<.001);
    }
    assert.ok(v.x>=0&&v.y>=0);assert.ok(v.x+600*v.scale<=w);assert.ok(v.y+720*v.scale<=h);
  }
});
