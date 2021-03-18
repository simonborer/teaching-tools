#!/usr/bin/env node

/***
	Okay, so currently HTML validation and serving the file via express are tightly coupled. The module `html-validator` needs a server to send the HTML to the W3C validation service. 

	Could these things be decoupled by moving to validation with `htmllint`? The answer is... maybe. I need to investigate in order to understand exactly how "unofficial" they mean when they say htmllint is "an unofficial html5 linter and validator."

	I'm also not sure, based on the docs, if htmllint could take over from the `console.assert` rules in `assertHTML.js`. Maybe it can! Maybe it's a true Swiss army knife.

	Anyway, for the time being, this has served my needs, because I do all this stuff at the same time anyway. So this is very opinionated at the moment. Do you care if CSS is coded mobile-first? Maybe not. I do.
***/

const [, , ...args] = process.argv;

const express = require('express'),
    app = express(),
    fs = require('fs'),
    path = require('path'),
    validator = require('html-validator'),
    { consoleTitle } = require("../utils/node/consoleTitle"),
    { validateCSS } = require('../utils/node/validateCSS'),
    { reportMediaQueries } = require('../utils/node/report-media-queries.js'),
    { cliExec } = require("../utils/node/cliexec");

const port = 3000;

const studentFolder = args[0];

const files = fs.readdirSync(studentFolder);

const fileArr = [];

const cssArr = [];

files.forEach(file => {
    if (path.extname(file) === '.html') {
        fileArr.push(file);
    } else if (path.extname(file) === '.css' && path.basename(file, '.css').toLowerCase() !== 'normalize') {
        cssArr.push(file);
    }
});

cssArr.forEach(cssFile => {
    if (cssArr.length > 1) {
        consoleTitle("Multiple CSS files, checking " + cssFile, 1);
    }
    const src = studentFolder + '/' + cssFile;
    validateCSS(src);
    reportMediaQueries(src);
});

let theFile = '';

if (fileArr.length > 1 && !fileArr.includes('index.html')) {
    // TODO right now you can only validate one HTML file. It would be very cool to crawl a multi-page site.
    console.warn("Where do you want to start? " + fileArr);
    return;
} else if (fileArr.length > 1) {
    const indexIndex = fileArr.indexOf('index.html');
    theFile = fileArr[indexIndex];
} else {
    theFile = fileArr[0];
}

app.use(express.static(studentFolder));

consoleTitle("Deploying server...");

app.listen(port, () => console.log(`listening on port ${port}!`));

(async () => {
    try {
        const localFile = 'http://localhost:' + port + '/' + theFile;
        const options = {
            url: localFile,
            format: 'text',
            isLocal: true,
            ignore: 'Warning: The “type” attribute is unnecessary for JavaScript resources.'
        };
        const result = await validator(options);
        consoleTitle("Checking valid HTML");
        console.log(result);
        
        /*** 
			I've commented out the line below because it depends on launching my text editor (Sublime) with the shortcut `subl`. Replace with your own shortcut to open your preferred text editor.
    	***/
        // cliExec("subl " + studentFolder);

        /***
			I've commented out the line below because it depends on the extremely handy `chrome-cli`. Highly recommend it because controlling the browser via scripting rules. `brew install chrome-cli` or visit https://github.com/prasmussen/chrome-cli.
        ***/
        // cliExec("chrome-cli open " + localFile);
        
    } catch (error) {
        console.error(error);
    }
})();