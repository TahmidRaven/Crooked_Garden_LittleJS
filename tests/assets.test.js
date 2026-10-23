import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';

test('studio branding retains the original FeastFury raven mark and separate ownership',async()=>{
  const root=resolve('public/assets'),{branding}=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
  assert.equal(branding.owner,'TahmidRaven / After Hours Arcade');
  assert.match(branding.source,/TahmidRaven\/FeastFury\/blob\/[a-f0-9]{40}\/assets\/FeastFury\/UI\/raven\.png$/);
  const bytes=await readFile(resolve(root,branding.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),branding.sha256);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
});

test('bundled external assets have sources, CC0 license evidence, and matching hashes',async()=>{
  const root=resolve('public/assets'),manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
  assert.ok(manifest.packs.length>=3,'Music and both art packs should be documented');
  for(const pack of manifest.packs){
    assert.equal(pack.license,'CC0-1.0');assert.ok(pack.author);assert.match(pack.source,/^https:\/\//);
    assert.match(pack.itch,/^https:\/\/[^/]+\.itch\.io\//);
    const license=await readFile(resolve(root,pack.licenseFile),'utf8');assert.match(license,/CC0|Creative Commons Zero/);
    for(const asset of pack.files){
      const file=resolve(root,asset.path);assert.ok(file.startsWith(root+sep));
      const bytes=await readFile(file);assert.ok(bytes.length>0);assert.ok(asset.original);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.path);
      if(file.endsWith('.png'))assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    }
  }
});
