#!/usr/bin/env node
const { cliExec } = require("./cliexec"),
  fs = require('fs'),
  assert = require('assert').strict;

const dt = require('../studentinfo.json');

const numberOfStudents = dt.length;

cliExec('rm output.txt');
cliExec('bash ./bash/pwGen.sh ' + numberOfStudents);

const generatePasswords = fs.readFileSync('output.txt', 'utf8');

const pwArray = generatePasswords.split(/(\n)+/g).filter(elem => elem !== ("\n"||""||null)).filter(n => n);

assert.ok(pwArray.length === numberOfStudents, "Wrong number of students, or passwords, depending on how you look at it.");

pwArray.forEach((pwd, index) => {
  dt[index].password = pwd;
});

const emails = [];
const sql = [];

dt.forEach(d => {
  const studentNumber = d["student number"];
  let stmt = "CREATE DATABASE " + studentNumber + ";";
  stmt += "CREATE USER '" + studentNumber + "'@'%' IDENTIFIED BY '" + d.password + "';";
  stmt += "CREATE TABLE " + studentNumber + ".demo (id INT PRIMARY KEY AUTO_INCREMENT, characters VARCHAR(20), dates DATE, decimal_numbers DECIMAL(8,2), whole_numbers INT, date_and_time DATETIME);";
  stmt += "GRANT ALL PRIVILEGES ON " + studentNumber + ".* TO '" + studentNumber + "'@'%';";
//   Shit, we do need to grant privileges to the library and theft databases to the new users. Aaaanyway...
  sql.push(stmt);
});

fs.writeFile('createStudentTables.sql', sql);

// dt.forEach(d => {
//   let em = "\"Hello " + d["first name"] + " " + d["last name"] + "!\n\nSo far in class we've just been reading data using SELECT statements, but shortly we'll start working with 'data manipulation language', where you can add, update and delete data. If everyone was trying to do this on the same database at the same time, that would be a big mess! As such, I've created a database for each of you.\n\nI'll go over how to make a new connection in DBeaver when we meet for our next lab - in other words, you don't need to do anything after receiving this email! It's just to give you your new username and password.\n\nYour username: " + d["student number"] + "\n\nYour password: " + d.password + "\n\nThat being said, setting up this new connection will be exactly the same process as it was before, except with a new username and password, plus access to a new database (which is called " + d["student number"] + " and which only you and I have access to).\n\n\n\n- Simon\"";
//   d.emailContent = em;
//   const emArr = [d.email, em];
//   emails.push(emArr);
// });

// let csvContent = "data:text/csv;charset=utf-8," + emails.map(e => e.join(",")).join("\n");

// var encodedUri = encodeURI(csvContent);
// var link = document.createElement("a");
// link.innerHTML = "download csv";
// link.setAttribute("href", encodedUri);
// link.setAttribute("download", "my_data.csv");
// document.body.appendChild(link);