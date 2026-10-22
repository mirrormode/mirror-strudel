#!/usr/bin/env node

import cowsay from 'cowsay';
import { createReadStream, existsSync } from 'fs';
import { readdir } from 'fs/promises';
import http from 'http';
import { join, resolve, sep } from 'path';
import os from 'os';

const LOG = !!process.env.LOG || false;
const PORT = process.env.PORT || 5432;
const VALID_AUDIO_EXTENSIONS = ['wav', 'mp3', 'ogg'];

const args = {};

// parse args
for (const arg of process.argv.slice(2)) {
  if (arg === '--json') args.json = true;
  if (arg === '--flat') args.flat = true;
  if (arg === '--dir') args.dir = process.argv[process.argv.indexOf(arg) + 1];
}

const directory = resolve(args.dir || process.cwd());
const banks = await getBanks(directory, args.flat);

// if --json, output banks and exit
if (args.json) {
  // striginfy in expanded format
  const json = JSON.stringify(banks, null, 2);
  console.log(json);
  process.exit(0);
}

function isAudioFile(f) {
  const ext = f.split('.').slice(-1)[0].toLowerCase();
  return VALID_AUDIO_EXTENSIONS.includes(ext);
};

async function getFilesInDirectory(directory) {
  let files = [];
  const dirents = await readdir(directory, { withFileTypes: true });
  for (const dirent of dirents) {
    const fullPath = join(directory, dirent.name);
    if (dirent.isDirectory()) {
      if (dirent.name.startsWith('.')) {
        LOG && console.warn(`ignore hidden folder: ${fullPath}`);
        continue;
      }
      try {
        const subFiles = (await getFilesInDirectory(fullPath)).filter(isAudioFile);
        files = files.concat(subFiles);
        LOG && console.log(`${dirent.name} (${subFiles.length})`);
      } catch (err) {
        LOG && console.warn(`skipped due to error: ${fullPath}`);
      }
    } else {
      isAudioFile(fullPath) && files.push(fullPath);
    }
  }
  return files;
}

async function getBanks(directory, flat) {
  const banks = {};
  const files = await getFilesInDirectory(directory);
  directory = directory.split(sep).join('/');
  files.forEach((path) => {
    path = path.split(sep).join('/');
    const subDir = path.replace(directory, '');
    const subDirFlat = subDir.replaceAll('/', '_').slice(1); // remove initial underscore
    const subDirFlatStem = subDirFlat.replace(/\.[^.]+$/, ''); // remove extension
    let bank = flat ? subDirFlatStem : path.split('/').slice(-2)[0];
    banks[bank] = banks[bank] || [];
    banks[bank].push(subDir);
    return subDir;
  });
  return banks;
}

console.log(
  cowsay.say({
    text: 'welcome to @strudel/sampler',
    e: 'oO',
    T: 'U ',
  }),
);

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.url === '/') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(banks));
  }
  let subpath = decodeURIComponent(req.url);
  const filePath = join(directory, subpath.split('/').join(sep));

  // console.log('GET:', filePath);
  const isFound = existsSync(filePath);
  if (!isFound) {
    res.statusCode = 404;
    res.end('File not found');
    return;
  }
  const readStream = createReadStream(filePath);
  readStream.on('error', (err) => {
    res.statusCode = 500;
    res.end('Internal server error');
    console.error(err);
  });
  readStream.pipe(res);
});

const IP_ADDRESS = '0.0.0.0';
let IP;
const networkInterfaces = os.networkInterfaces();

Object.keys(networkInterfaces).forEach((key) => {
  networkInterfaces[key].forEach((networkInterface) => {
    if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
      IP = networkInterface.address;
    }
  });
});

server.listen(PORT, IP_ADDRESS, () => {
  console.log(`@strudel/sampler is now serving audio files from:
 ${directory}

To use them in the Strudel REPL, run:
 samples('http://localhost:${PORT}')

Or on a machine in the same network:
 ${IP ? `samples('http://${IP}:${PORT}')` : `Unable to determine server's IP address.`}
`);
});
