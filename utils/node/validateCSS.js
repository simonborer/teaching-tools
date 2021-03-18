#!/usr/bin/env node

const { consoleTitle } = require("./consoleTitle.js"), 
	{ validateFile } = require('csstree-validator');

const validateCSS = function(src) {
	const cssValid = validateFile(src);
	consoleTitle("Checking " + src + " for valid CSS");
	if (cssValid[src].length === 0) {
	    console.log("CSS is valid!");
	} else {
	    cssValid[src].forEach(msg => {
	        console.warn(msg.message + " at l." + msg.line + " c." + msg.column);
	    });
	}
};

exports.validateCSS = validateCSS;