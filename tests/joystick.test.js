import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stickVector} from '../src/joystick.js';

test('joystick rests in the dead zone without growth or a direction',()=>{
  for(const [x,y] of [[0,0],[2,3],[-3,-2]]){
    const stick=stickVector(x,y,40);
    assert.equal(stick.growing,false);assert.equal(stick.x,0);assert.equal(stick.y,0);
  }
});
test('joystick follows all directions and clamps travel even outside the pad',()=>{
  for(const [x,y] of [[40,0],[0,-40],[-40,0],[0,40],[500,-500]]){
    const stick=stickVector(x,y,40),length=Math.hypot(x,y);
    assert.equal(stick.growing,true);
    assert.equal(stick.x,x/length);assert.equal(stick.y,y/length);
    assert.ok(Math.abs(Math.hypot(stick.travelX,stick.travelY)-40)<1e-9);
  }
});
