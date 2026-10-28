import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';

test('browser and home-screen icons are bundled and use relative links for embedded builds',async()=>{
  const html=await readFile('index.html','utf8');
  for(const name of ['favicon.svg','favicon-32.png','favicon.ico','apple-touch-icon.png']){
    assert.ok(html.includes(`href="./${name}"`));
    assert.ok((await readFile(`public/${name}`)).length>0);
  }
  const svg=await readFile('public/favicon.svg','utf8');
  assert.match(svg,/viewBox="0 0 64 64"/);assert.match(svg,/#e6ad50/);
  for(const [name,size] of [['favicon-32.png',32],['apple-touch-icon.png',180]]){
    const bytes=await readFile(`public/${name}`);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[size,size]);
  }
  assert.equal((await readFile('public/favicon.ico')).subarray(0,4).toString('hex'),'00000100');
});

test('studio branding retains the original FeastFury raven mark and separate ownership',async()=>{
  const root=resolve('public/assets'),{branding}=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
  assert.equal(branding.owner,'TahmidRaven / After Hours Arcade');
  assert.match(branding.source,/TahmidRaven\/FeastFury\/blob\/[a-f0-9]{40}\/assets\/FeastFury\/UI\/raven\.png$/);
  const bytes=await readFile(resolve(root,branding.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),branding.sha256);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
});

test('guide illustrations retain their showcase sources, PNG dimensions and hashes',async()=>{
  const root=resolve('public/assets/help'),manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
  assert.equal(manifest.files.length,5);
  for(const source of manifest.sources){
    assert.match(source.path,/^screenshots\/[\w-]+\.png$/);
    assert.equal(createHash('sha256').update(await readFile(source.path)).digest('hex'),source.sha256);
  }
  for(const file of manifest.files){
    assert.match(file.path,/^[\w-]+\.png$/);
    const bytes=await readFile(resolve(root,file.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],file.size);
  }
});

test('guide motion clips are small animated GIFs with recorded dimensions and hashes',async()=>{
  const root=resolve('public/assets/help'),manifest=JSON.parse(await readFile(`${root}/motion-manifest.json`,'utf8'));
  assert.equal(manifest.files.length,3);
  for(const file of manifest.files){
    assert.match(file.path,/^[\w-]+\.gif$/);
    const bytes=await readFile(resolve(root,file.path));
    assert.match(bytes.subarray(0,6).toString(),/^GIF8[79]a$/);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    assert.deepEqual([bytes.readUInt16LE(6),bytes.readUInt16LE(8)],file.size);
    assert.ok(file.frames>5);assert.ok(bytes.length<2_000_000);
  }
});

test('bundled external assets have sources, explicit license evidence, and matching hashes',async()=>{
  const root=resolve('public/assets'),manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
  assert.ok(manifest.packs.length>=3,'Music and both art packs should be documented');
  for(const pack of manifest.packs){
    if(pack.name==='Free Pixel Art Forest')assert.equal(pack.license,'LicenseRef-Eder-Muniz');
    else assert.equal(pack.license,'CC0-1.0');
    assert.ok(pack.author);assert.match(pack.source,/^https:\/\//);
    assert.match(pack.itch,/^https:\/\/[^/]+\.itch\.io\//);
    const license=await readFile(resolve(root,pack.licenseFile),'utf8');
    if(pack.name==='Free Pixel Art Forest'){
      assert.match(license,/commercially/);assert.match(license,/appropriate credit/);
      assert.match(await readFile(resolve(root,pack.permissionsFile),'utf8'),/open source projects/);
    }else assert.match(license,/CC0|Creative Commons Zero/);
    for(const asset of pack.files){
      const file=resolve(root,asset.path);assert.ok(file.startsWith(root+sep));
      const bytes=await readFile(file);assert.ok(bytes.length>0);assert.ok(asset.original);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.path);
      if(file.endsWith('.png'))assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    }
  }
});

test('Courier Prime Bold is retained under OFL for the cover generator, not gameplay',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  const font=manifest.fonts.find(font=>font.name==='Courier Prime');assert.ok(font);assert.equal(font.license,'OFL-1.1');assert.equal(font.files.length,1);
  assert.match(font.scope,/cover/);assert.match(font.files[0].path,/courier-prime-bold/);
  const license=await readFile(`public/assets/${font.licenseFile}`,'utf8');
  assert.match(license,/SIL OPEN FONT LICENSE Version 1\.1/);assert.match(license,/Courier Prime Project Authors/);
  for(const file of font.files){
    const bytes=await readFile(`public/assets/${file.path}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    assert.equal(bytes.subarray(0,4).toString('hex'),'00010000','TrueType font signature');
  }
  const css=await readFile('src/simple-ui.css','utf8');assert.match(css,/@font-face/);
  assert.doesNotMatch(css,/fonts\.googleapis\.com|fonts\.gstatic\.com/,'No runtime font CDN');
});

test('selected flat-line buttons, common icons and stars have local CC0 provenance',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  const pack=manifest.packs.find(pack=>pack.name==='UI Pack');assert.ok(pack);assert.equal(pack.files.length,8);
  for(const file of pack.files){
    assert.match(file.sourceSha256,/^[a-f0-9]{64}$/);
    const svg=await readFile(`public/assets/${file.path}`,'utf8');assert.match(svg,/<svg\s/);
    assert.doesNotMatch(svg,/<(?:script|foreignObject|image)\b|(?:xlink:)?href\s*=/i);
  }
  const css=await readFile('src/simple-ui.css','utf8');assert.match(css,/simple-button-primary\.svg/);assert.match(css,/simple-square\.svg/);
});

test('hover and select cues are small credited original local OGG files',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  const pack=manifest.packs.find(pack=>pack.name==='Interface Sounds');assert.ok(pack);assert.equal(pack.license,'CC0-1.0');assert.equal(pack.files.length,2);
  for(const file of pack.files){
    const bytes=await readFile(`public/assets/${file.path}`);assert.equal(bytes.subarray(0,4).toString(),'OggS');assert.ok(bytes.length<20000);
  }
  assert.match(await readFile(`public/assets/${pack.licenseFile}`,'utf8'),/CC0/);
});

test('retired skins, rejected backgrounds and unused font formats are removed',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  assert.deepEqual(manifest.fonts.map(f=>f.name).sort(),['Courier Prime','Kaph']);
  assert.ok(!manifest.packs.some(p=>p.name==='Amber Forest / Forest Background'||p.name==='UI Pack - Adventure'));
  for(const path of ['src/adventure-ui.css','public/assets/ui/adventure-wood.svg','public/assets/art/amber-forest.png','scripts/prepare-amber-forest.py','public/assets/fonts/Kaph_Font_1_20'])await assert.rejects(access(path));
  assert.deepEqual((await readdir('public/assets/fonts')).filter(name=>!name.startsWith('.')).sort(),['courier-prime-bold.ttf','kaph-italic.woff2','kaph-regular.woff2']);
  assert.doesNotMatch(await readFile('src/art.js','utf8'),/foliage:/,'Promotional foliage is not loaded during game startup');
});

test('Kaph 1.20 is bundled unchanged with GGBotNet credit and used throughout the game',async()=>{
  const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
  const font=manifest.fonts.find(font=>font.name==='Kaph');assert.ok(font);assert.equal(font.license,'OFL-1.1');assert.equal(font.author,'GGBotNet');
  const notice=await readFile(`public/assets/${font.licenseFile}`,'utf8');assert.match(notice,/GGBotNet/);assert.match(notice,/SIL OPEN FONT LICENSE Version 1\.1/);
  for(const file of font.files){
    const bytes=await readFile(`public/assets/${file.path}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    assert.equal(bytes.subarray(0,4).toString(),'wOF2');
  }
  assert.match(await readFile('src/simple-ui.css','utf8'),/kaph-regular\.woff2/);
  assert.match(await readFile('src/scene.js','utf8'),/Kaph/);
  for(const path of ['src/menu.css','src/simple-ui.css','src/scene.js','src/main.js'])assert.doesNotMatch(await readFile(path,'utf8'),/Courier Prime|EB Garamond/);
});

test('every in-game local license link still resolves after unused-asset cleanup',async()=>{
  const html=await readFile('index.html','utf8');
  for(const [,file] of html.matchAll(/href="\.\/assets\/(licenses\/[^"#]+)"/g))assert.ok((await readFile(`public/assets/${file}`)).length>0,file);
});
