#!/usr/bin/env node

const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const path = require('path');
const expect = require('expect');
const { consoleTitle } = require("../utils/node/consoleTitle");


let output = "";

const getDirectories = source =>
    fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const dirsArr = getDirectories('work2');

const validMsg = (msg) => {
    console.log("\x1b[1m\x1b[32m%s\x1b[0m", "✓ " + msg);
};

const errMsg = (msg) => {
    console.log("\x1b[1m\x1b[31m%s\x1b[0m", "x " + msg);
    output += "failed: " + msg + "\n";
}

const ifHasAttr = (elem, attr) => {
    if (elem) {
        return elem.getAttribute(attr);
    } else {
        return 'nope';
    }
}

const validation = (file, dir = 'work2/') => {
	if (!dir === 'work2/') {
		dir = 'work2/' + dir
	}
    if (path.extname(file) === '.html') {
        const filename = file.split('.').slice(0, -1).join('.');
        const data = fs.readFileSync(dir + '/' + file, 'utf8');
        const dom = new JSDOM(data);
        const doc = dom.window.document;

        const tst = {
            doctype: {
                elem: doc.doctype?.name,
                msg: "has a valid doctype"
            },
            html: {
                elem: doc.querySelectorAll('html'),
                msg: "has one html element"
            },
            lang: {
                elem: doc.querySelectorAll('html')[0].getAttribute("lang"),
                msg: "html element has a valid lang attribute"
            },
            head: {
                elem: doc.querySelectorAll('html > head').length,
                msg: "has one head element as a child of the html element"
            },
            title: {
                elem: doc.querySelectorAll('html > head > title').length,
                msg: "has a title element in the head"
            },
            charset: {
                elem: ifHasAttr(doc.querySelectorAll('html > head > meta[charset]')[0], "charset"),
                msg: "has valid charset"
            },
            body: {
                elem: doc.querySelectorAll('html > body').length,
                msg: "has one body element as a child of the html element"
            },
            header: {
                elem: doc.querySelectorAll('body > header').length,
                msg: "has a header"
            },
            headline: {
                elem: doc.querySelectorAll('header > h1').length,
                msg: "has a headline"
            },
            main: {
                elem: doc.querySelectorAll('body > main').length,
                msg: "has a main element"
            },
            footer: {
                elem: doc.querySelectorAll('body > footer').length,
                msg: "has a footer"
            },
            hero: {
                elem: doc.querySelectorAll('header > img').length,
                msg: "has a hero image"
            },
            heroAlt: {
                elem: ifHasAttr(doc.querySelectorAll('header > img')[0], "alt"),
                msg: "...and the hero image has an alt attribute"
            },
            table: {
                elem: doc.querySelectorAll('main > table').length,
                msg: "has a table in the main section"
            }
        };

        consoleTitle("Let's see if " + filename + "...");
        output += "\n" + filename + "\n"

        try { expect(tst.doctype.elem).toBe('html');
            validMsg(tst.doctype.msg); } catch { errMsg(tst.doctype.msg); }

        try { expect(tst.html.elem.length).toEqual(1);
            validMsg(tst.html.msg); } catch { errMsg(tst.html.msg); }

        try { expect(tst.lang.elem).toBe('en');
            validMsg(tst.lang.msg); } catch { errMsg(tst.lang.msg); }

        try { expect(tst.head.elem).toEqual(1);
            validMsg(tst.head.msg); } catch { errMsg(tst.head.msg); }

        try { expect(tst.title.elem).toEqual(1);
            validMsg(tst.title.msg); } catch { errMsg(tst.title.msg); }

        try { expect(tst.charset.elem).toBe('utf-8');
            validMsg(tst.charset.msg); } catch { errMsg(tst.charset.msg); }

        try { expect(tst.body.elem).toEqual(1);
            validMsg(tst.body.msg); } catch { errMsg(tst.body.msg); }

        try { expect(tst.header.elem).toEqual(1);
            validMsg(tst.header.msg); } catch { errMsg(tst.header.msg); }

        try { expect(tst.headline.elem).toEqual(1);
            validMsg(tst.headline.msg); } catch { errMsg(tst.headline.msg); }

        try { expect(tst.main.elem).toEqual(1);
            validMsg(tst.main.msg); } catch { errMsg(tst.main.msg); }

        try { expect(tst.footer.elem).toEqual(1);
            validMsg(tst.footer.msg); } catch { errMsg(tst.footer.msg); }

        try { expect(tst.hero.elem).toBeGreaterThan(0);
            validMsg(tst.hero.msg); } catch { errMsg(tst.hero.msg); }

        try { expect(tst.heroAlt.elem).toBeTruthy();
            validMsg(tst.heroAlt.msg); } catch { errMsg(tst.heroAlt.msg); }

        try { expect(tst.table.elem).toBeGreaterThan(0);
            validMsg(tst.table.msg); } catch { errMsg(tst.table.msg); }

        console.log("\n");
    }
}

fs.readdirSync('work2/').forEach(file => {
    validation(file);
});

dirsArr.forEach(dir => {
    fs.readdirSync('work2/' + dir).forEach(file => {
        validation(file, dir);
    });
});

try {
  const data = fs.writeFileSync('./work2/output.txt', output)
  //file written successfully
} catch (err) {
  console.error(err)
}