#!/usr/bin/env node
const consoleTitle = function(msg, theme = 0) {
    if (theme === 1) {
        console.log('\x1b[4m\x1b[46m\x1b[97m%s\x1b[0m', "\n" + msg);
    } else {
        console.log('\x1b[4m\x1b[44m\x1b[97m%s\x1b[0m', "\n" + msg);
    }
};

exports.consoleTitle = consoleTitle;