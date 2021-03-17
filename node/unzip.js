#!/usr/bin/env node

/*** 
To run this script: 
	- make sure you have command line utilities `unzip` (native on OSX) and `7z` (install with `brew install p7zip`)
	- download student work into a folder called /work/
***/

const fs = require('fs'),
    path = require('path'),
    { cliExec } = require("../utils/node/cliexec");

cliExec("bash bash/nospaces.sh ./work && mkdir -p ./work2 && cp -r ./work/* ./work2");

fs.readdirSync('./work2').forEach(file => {
    const extension = path.extname(file);
    if (extension === ".rar" || extension === ".zip" || extension === '.7z') {
        const justName = file.replace(/\.[^/.]+$/, "");
        const yourOwnFolder = "./work2/" + justName;
        cliExec("mkdir " + yourOwnFolder);
        if (extension === ".rar" || extension === ".7z") {
            cliExec("7z x ./work/" + file + " -o" + yourOwnFolder);
        } else if (extension === ".zip") {
            cliExec("unzip './work/" + file + "' -d " + yourOwnFolder);
        }
        cliExec("mkdir -p ./work/archive && mv './work2/" + file + "' './work/archive/" + file + "' && rm -rf ./work/" + file);
    } else {
        console.log("skipping " + file);
    }
});

const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());

dirs('./work2').forEach(folder => {
    // TODO shouldn't this be an rm -rf of archive if exists, since there's no use for /work2/archive/?
    if (folder !== 'archive') {
        const dirents = fs.readdirSync('./work2/' + folder, { withFileTypes: true });
        const filesNames = dirents
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name);
        const index = filesNames.indexOf('.DS_Store');
        if (index > -1) { filesNames.splice(index, 1); }
        const directoryNames = dirents
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        // TODO is this recursive?
        const osxindex = directoryNames.indexOf('__MACOSX');
        if (osxindex > -1) {
            directoryNames.splice(osxindex, 1);
            cliExec("rm -rf ./work2/" + folder + "/__MACOSX");
        }
        if (directoryNames.length === 1) {
            cliExec('mv "./work2/' + folder + '/' + directoryNames[0] + '/"* ./work2/' + folder + '/ && rm -rf "./work2/' + folder + '/' + directoryNames[0] + '/"');
        } else if (directoryNames.length > 1) {
            console.log("Not sure what to do with this: " + directoryNames);
        } else {
            console.log("Not gonna do anything with " + folder);
        }
    }
});

cliExec("rm -rf ./work2/archive");