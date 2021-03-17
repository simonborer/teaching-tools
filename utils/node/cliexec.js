#!/usr/bin/env node
const { execSync } = require("child_process");

const cliExec = function(command) {
    execSync(command, (error, stdout, stderr) => { if (error) { console.log(`error: ${error.message}`); return; } if (stderr) { console.log(`stderr: ${stderr}`); return; } });
};

exports.cliExec = cliExec;