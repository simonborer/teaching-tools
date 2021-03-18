#!/usr/bin/env node

const {consoleTitle} = require("consoleTitle.js");

const detectMobileLast = function(nodeArray) {
    consoleTitle("Checking mobile-first");
    const findMediaquery = nodeArray.find(o => o.name === "media");
    if (typeof findMediaquery === "undefined") {
      console.warn("No media queries detected");
    }
    nodeArray.forEach(node => {
        if (node.type === "atrule" && node.name === "media") {
            if (node.params.indexOf("max-width") !== -1) {
                console.warn("Has media query: " + node.params);
            } else if (node.params.indexOf("min-width") >= 0) {
                console.log("Has mobile-first media query: " + node.params);
            } else {
                console.warn("Has media query: " + node.params);
            }
        }
    });
};

exports.detectMobileLast = detectMobileLast;