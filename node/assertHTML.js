#!/usr/bin/env node

const [, , ...args] = process.argv;

const { consoleTitle } = require("../utils/node/consoleTitle"),
	fs = require('fs'),
	path = require('path');

let folder = 'work2';

if (typeof args[0] !== "undefined") {
    folder = args[0];
}

let requirementsJSON = '';

if (typeof args[1] !== "undefined") {
    requirementsJSON = fs.readFileSync(folder + '/' + args[1]);
} else {
    requirementsJSON = fs.readFileSync(folder + '/requirements.json');
}

const requirements = JSON.parse(requirementsJSON);

const generateAssertion = function(req) {
    return "console.log('Asserting " + req + "');console.assert(" + requirements[req] + ", '" + req + "'+errorMsg);";
};

let assertion = '<script>const errorMsg=" not found";';

assertion += 'const stuffToFind=' + JSON.stringify(requirements["tags exist"]) + ';';

requirements.custom.forEach(req => {
    const customAssertion = "console.log('Asserting " + req["description"] + "');console.assert(" + req["requirement"] + ", '" + req["description"] + "'+errorMsg);";
    assertion += customAssertion;
});

assertion += 'stuffToFind.forEach(e=>{console.log("Asserting " + e);console.assert(document.querySelectorAll(e).length>0,{stuff:e,errorMsg:errorMsg});});';

requirements.loops.forEach(req => {
	const loopAssertion = "document.querySelectorAll('" + req.querySelector + "').forEach(elem => {console.assert(elem.hasAttribute('" + req.attr + "') === true, elem + \" \" + errorMsg)});";
	assertion += loopAssertion;
});

assertion += '</script>';

const onFileContent = function(filename, content) {
    const result = content.replace(/<\/body>/g, assertion + "</body>");
    fs.writeFile(filename, result, 'utf8', function(err) {
        if (err) return console.log(err);
    });
    console.log("Script injected into " + filename);
};

function fromDir(startPath, filter) {
    if (!fs.existsSync(startPath)) { console.log("no dir ", startPath); return; }

    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory() && filename !== folder + '/archive') {
            fromDir(filename, filter);
        } else if (filename.indexOf(filter) >= 0) {
            const fname = filename;
            fs.readFile(fname, 'utf-8', function(err, content) {
                if (err) { console.log(err); return; }
                onFileContent(fname, content);
            });
        }
    }
}

consoleTitle("Script injection...");
fromDir('./' + folder, '.html');