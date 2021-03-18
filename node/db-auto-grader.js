#!/usr/bin/env node

/***
    This is a straight up dump of what I've been working with.
    Gotta modularize this!
***/

// Get arguments
const [, , ...args] = process.argv;

// Get config 
// This is gitignored in the repo, for obvious reasons
const config = require('../db-config');

// Get modules
const util = require('util'),
    path = require('path'),
    fs = require('fs'),
    https = require('https'),
    http = require('http'),
    request = require('request'),
    mysql = require('mysql'),
    sqlite3 = require('sqlite3').verbose(),
    Diff = require('diff'),
    { exec } = require("child_process");

// Where the SQLite DB lives
const chinookPath = './Chinook_Sqlite.sqlite';

// Download file as a promise
const downloadPage = function(url, file) {
    return new Promise((resolve, reject) => {
        request(url).pipe(fs.createWriteStream(file));
    });
}

// Download the Chinook SQLite database
async function downloadChinook() {
    try {
        await downloadPage('https://github.com/lerocha/chinook-database/blob/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite?raw=true', chinookPath);
    } catch (error) {
        console.error('ERROR:');
        console.error(error);
    }
}

const connection = mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
});

const readFile = util.promisify(fs.readFile),
    readdir = util.promisify(fs.readdir),
    query = util.promisify(connection.query).bind(connection);

const directoryPath = path.join(`./`, `${args[0]}`);

const extractStatements = function(fileData, file) {
    const getQuestionsRegexp = /--\s*[Qq]*[0-9]{1,2}.*/g;
    const questionComments = [...fileData.match(getQuestionsRegexp)];
    questionComments.forEach(str => {
        const questionNumber = '-- Question ' + str.match(/[0-9]{1,2}/) + '\n';
        fileData = fileData.replace(str, str + '\n' + questionNumber);
    });
    const splitData = fileData.split(/--\s*[0-9]{1,2}.*/);
    splitData.forEach((d, index) => {
        if (typeof d !== 'undefined') {
            splitData[index] = d.replace(/--(?! Question [0-9]{1,2}\n)(.|\.)*/g, '').replace(/(\n)/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
            splitData[index] = splitData[index].replace(/-- Question [0-9]{1,2}/, '-- Question ' + splitData[index].match(/[0-9]{1,2}/) + '\n');
        }
    });
    if (splitData === "undefined") {
        console.log("splitData is undefined")
    }
    if (splitData[0] === '') { splitData.shift(); }
    return splitData;
};

const report = {};

async function workWithStatements(statements) {
    if (args[1] === 'sqlite') {
        if (!fs.existsSync(chinookPath)) {
            await downloadChinook();
            // TODO: Obvs, not an ideal workflow
            console.log("Had to download the Chinook database. Please rerun the script.");
            return;
        }
        const db = new sqlite3.Database(chinookPath);
        const sqliteAll = util.promisify(db.all).bind(db);
        for (const [key, value] of Object.entries(statements)) {
            report[key] = [];
            const reporting = await Promise.all(value.map(async (stmt) => {
                /* 
                    So, I think this assumes that the statement
                    is a select statement, which _should_ be 
                    okay, as by the time we've got to DML, we've
                    weaned them off the in-browser stuff.
                */
                const queryResults = await sqliteAll(stmt).catch(err => { return err });
                if (stmt.match(/[0-9]{1,2}/)) {
                report[key].push({
                    "q": stmt.match(/[0-9]{1,2}/)[0],
                    "statement": stmt,
                    "results": queryResults
                });
            }
            }));
        }
        db.close();
    } else {
        connection.connect();
        for (const [key, value] of Object.entries(statements)) {
            report[key] = [];
            const reporting = await Promise.all(value.map(async (stmt) => {
                const queryResults = await query(stmt).catch(err => { return err });
                if (stmt.match(/[0-9]{1,2}/) == null) {
                    console.log("Formatting error in " + key);
                }
                report[key].push({
                    "q": stmt.match(/[0-9]{1,2}/)[0],
                    "statement": stmt,
                    "results": queryResults
                });
            }));
        }
        connection.end();
    }
};

const reportOn = function(report) {
    console.log('Reporting...\n');
    const reportOutput = {};


    const students = Object.keys(report)
        .filter(key => key !== 'key')
        .reduce((obj, key) => {
            obj[key] = report[key];
            return obj;
        }, {});

    const prof = report['key'];

    for (const [key, value] of Object.entries(students)) {
        value.forEach((call, index) => {
            const questionNumber = call.q;
            let matchToProf = prof.filter(obj => {
              return obj.q === questionNumber
            });
            matchToProf = matchToProf[0];

            if (typeof call === "undefined") {console.error("call " + call);}
            
            if (typeof matchToProf === "undefined") {matchToProf = {"statement": "","results": ""}}
            const studentStatement = call['statement'],
                profStatement = matchToProf['statement'],
                studentResult = JSON.stringify(call['results']),
                profResult = JSON.stringify(matchToProf['results']);

            const statementDiff = Diff.diffChars(profStatement, studentStatement, { ignoreCase: true });
            // TODO: create a flag to include column headings. If the flag is not present, exclude column headings. Rationale: we're getting "no match" whenever the student uses a column alias, even when the data is the same.
            const resultDiff = profResult === studentResult;
            // TODO cont'd: Since the JSON format of the return values makes parsing column titles challenging, here's a smoketest as a stopgap - count the number of rows.
            const rowNumberDiff = call['results'].length === matchToProf['results'].length;

            students[key][index]['statementDiffLog'] = '';
            students[key][index]['resultDiffLog'] = '';

            if (statementDiff.length === 1 && !statementDiff[0].added && !statementDiff[0].removed) {
                students[key][index]['statementDiffLog'] = '<strong>SYNTAX: </strong><span class="green">match</span><br>';
            } else {
                students[key][index]['statementDiffLog'] += '<strong>SYNTAX DIFF: </strong><br>';
                statementDiff.forEach((part) => {
                    const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
                    students[key][index]['statementDiffLog'] += '<span class="' + color + '">' + part.value + '</span>';
                });
            }

            if (resultDiff === true) {
                students[key][index]['resultDiffLog'] = '<strong>RESULTS: </strong><span class="green">match</span><br>';
            } else if (rowNumberDiff === true) {
                students[key][index]['resultDiffLog'] = '<strong>RESULTS: </strong><span class="orange">data differs, rows equal</span><br>';
            } else {
                students[key][index]['resultDiffLog'] = '<strong>RESULTS: </strong><span class="red">no match</span><br>';
            }

        });
    }

    let contentArr = "";
    for (const [key, value] of Object.entries(students)) {
        students[key].sort((a,b) => (a.q > b.q) ? 1 : ((b.q > a.q) ? -1 : 0))
    }

    for (const [key, value] of Object.entries(students)) {
        let formattedReport = '<table><thead><tr><th>' + key + '</th></tr></thead><tbody>';
        value.forEach((val, index) => {
            if (typeof val === "undefined") {
                console.error("value is undefined")
            }
            formattedReport += '<tr><td><pre class="language-sql"><code class="language-sql">' + val['statement'] + '</code></pre></tr></td>';
            formattedReport += '<tr><td>' + val['statementDiffLog'] + '</tr></td>';
            formattedReport += '<tr><td>' + val['resultDiffLog'] + '</tr></td>';
        })
        formattedReport += '</tbody></table>'
        contentArr += formattedReport;
    }

    function buildHtml(req) {
        var header = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.5.0/styles/qtcreator_dark.min.css" integrity="sha512-2Wt9SXPBtcIDFaQOb1FL0pfyY/mDAFamDri20eCvhAZiTrmbLemGHw9cxWsGKOGctQ5LkDBX75p5f5veQHMCAA==" crossorigin="anonymous" /><script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.5.0/highlight.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.5.0/languages/sql.min.js" integrity="sha512-9RWGXdK0kVcXZnoBhFWddtHMDJTk8Dpp35IDirAliEAKIbcQEQSkGHiT+Ypcdw2uVULZQnGaO/RWHwegoGVSpA==" crossorigin="anonymous"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.5.0/languages/sql_more.min.js" integrity="sha512-VZb562jDiT5SseiBeIbab7m7NfsS7vuwmxzs0mP80GT5gW7EsSAyBz+i6vb3MiCYgtuuoZXiJdIemZ0L0RcJUw==" crossorigin="anonymous"></script><script>hljs.initHighlightingOnLoad();</script><style>*{font-size:20px;font-family:monospace;line-height:1.2;max-width:100vw;margin:0;padding:0;}body{margin:0 auto;max-width:750px;padding:2rem;border-radius:6px;overflow-x: hidden;word-break:break-word;overflow-wrap:break-word;}table {border-collapse:collapse;width:100%;margin-bottom:6rem;}td,th{border:1px solid #E5E7EB;text-align:left;padding:.5rem;}th{background: #F6F8FA;}tr:nth-child(even){background:#F6F8FA;}.green{color:green}.red{color:red}.orange{background-color:orange;}thead th{font-size:1.5rem;text-decoration:underline;position:sticky;top:0;left:0;}.grey{color:#737373}pre.language-sql {margin-top: 4rem;white-space: pre-wrap;}</style>';
        var body = contentArr;

        return '<!DOCTYPE html>' +
            '<html><head>' + header + '</head><body>' + body + '</body></html>';
    };
    exec("chrome-cli open http://localhost:8080", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
    http.createServer(function(req, res) {
        var html = buildHtml(req);
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': html.length,
            'Expires': new Date().toUTCString()
        });
        res.end(html);
    }).listen(8080);

};

async function callRead() {
    try {
        const files = await readdir(directoryPath);
        let statements = {};
        const filesFilter = files.filter(file => path.extname(file) === '.sql');
        await Promise.all(filesFilter.map(async (file) => {
            const data = await readFile(path.join(directoryPath, file), 'utf8');
            file = file.replace('.sql', '').replace(/\s+/g, ' ');
            statements[file] = extractStatements(data, file);
        }));
        await workWithStatements(statements);
        reportOn(report);
    } catch (err) {
        console.log(err)
    }
}

callRead();