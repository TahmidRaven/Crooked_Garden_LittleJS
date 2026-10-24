import { copyFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// index.html must be at the archive root for itch.io's HTML game loader.
await copyFile('CREDITS.md','dist/CREDITS.md');
await mkdir('buildDirectories',{recursive:true});
const archive=resolve('buildDirectories/crooked-garden.zip');
// Synchronize an existing ZIP too, so removed assets cannot linger.
const result=spawnSync('zip',['-r','-FS',archive,'.'],{cwd:'dist',stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)throw new Error(`zip exited with status ${result.status}`);
console.log(`itch.io package: ${archive}`);
