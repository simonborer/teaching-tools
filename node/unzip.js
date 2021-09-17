#!/usr/bin/env node

/*** 
To run this script: 
    - make sure you have command line utilities `unzip` (native on OSX) and `7z` (install with `brew install p7zip`)
    - download student work into a folder called /work/
***/

const fs = require('fs'),
    path = require('path'),
    { cliExec } = require("../utils/node/cliexec");

let gradebook = fs.readdirSync('./work')
    .filter(file => file.startsWith('gradebook_'))
    .map(file => path.resolve(__dirname, file));

if (gradebook.length !== 0) {
    cliExec("unzip './work/gradebook_*.zip' -d ./work && rm -rf ./work/gradebook_* && rm ./work/*.txt");
}

fs.readdirSync('./work').forEach(file => {
    if (path.basename(file).includes("'")) {
        fs.renameSync(path.join('./work', file), path.join('./work', file.replace("'","")));
    }
});

cliExec("bash bash/nospaces.sh ./work && mkdir -p ./work2 && cp -r ./work/* ./work2");

fs.readdirSync('./work2').forEach(file => {
    file = file.replace("'", "");
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
        cliExec("mv './work/" + file + "' './work/archive/" + file + "'");
    }
});

const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());

const renameHTML = (folder) => {
    const studentNumber = folder.match(/_n[\d]{8}/)[0].replace("_", "");
    fs.readdirSync(folder).forEach(file => {
        fs.renameSync(folder + "/" + file, folder + "/" + studentNumber + "_" + file.replace(" ", "_").replace("_" + studentNumber, "_"),
            function(err) {
                if (err) console.log('ERROR: ' + err);
            });
    });
    // fs.rmdirSync(folder);
};

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
        }
        renameHTML("./work2/" + folder);
    }
});

cliExec("bash bash/nospaces.sh ./work2");
cliExec("rm -rf ./work2/archive");

console.log("if this is a 'single-pager' assignment, run 'mv ./work2/*/*.html ./work2 && rm -r ./work2/*/'");