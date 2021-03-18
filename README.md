# teaching-tools

COVID brought new challenges to teaching. For me, that included the requirement to give personal feedback on 80-100 student assignments each week. Since I don't get paid to grade, finding ways to shave a minute or two off of the work of grading can translate into hours of personal time recovered each week.

This repo constitutes a variety of tools that have helped me find these efficiencies.

## Use
(Still need to write this part - usage represented in this repo doesn't necessarily represent how I use these scripts in my regular workflow - I put my bash scripts in my `/bin/` folder and alias them in my `.bashrc`; node scripts are [run as cli tools](https://developer.okta.com/blog/2019/06/18/command-line-app-with-nodejs), etc. Also, there's a lot of opinionated, albeit relative, file paths in these scripts - that should be taken care of for enhanced usability)

## Problems being solved
- Partial automation for [downloading student work from Blackboard](#get-assignments)
- After downloading student work, [uncompressing a variety of file formats, cleaning up the uncompressed directory structure and deleting superfluous system files](#unzip).
- Partial automation for [giving students their own remote databases](#notify), and [emailing them their credentials](#generate-db-emails).
- [Quickly check if a page contains elements, attributes, etc. dictated by assignment requirements.](#assert-html)
- [Batch replace spaces with underscores in files and directories for easier command line access](#nospaces)
- [Fix Quicktime bug that records external sound to only one channel](#tomono)
- [Validate CSS](#validate-and-serve)
- [Validate HTML](#validate-and-serve)
- [Open page with express server and chrome-cli](#validate-and-serve)
- [Parse CSS with PostCSS](#validate-and-serve)
- [Diff student SQL queries with the answer key.](#coming-soon)
- [Connect to either a SQLite or MySQL database to diff the results from student queries and your answer key (including matching the number of rows and perfect matches). Generates a report page to quickly evaluate student work.](#coming-soon)
- [Build a requirements checklist and quickly fill out a rubric](#coming-soon)
- [Write once in Hugo to generate both slides & notes, deployed via Netlify.](#coming-soon)

## Pain points
- Blackboard API endpoints would allow for **a lot** of automation
- I haven't fully explored these well-regarded linting libraries. A lot of possibilities here.
 - [SQL Lint](https://github.com/joereynolds/sql-lint)
 - [Stylelint](https://stylelint.io/)
 - [HTML Lint](https://github.com/htmllint/htmllint)
- Obviously I'd like to extend these tools to be more helpful to instructors teaching other classes. Need their input on how best to make things extensible.
- I'd ultimately like to give students access to (some) of the testing tools so they could ask more targetted questions (and ultimately produce higher quality work). This could be a little tricky, as I don't want to expose my answer keys, or make the targets for producing cool work too narrow.

## Tools
- [UI.Vision](#ui-vision)
- [Node](#node)
- [Bash](#bash)

## UI.Vision

[UI.Vision](https://ui.vision/) is a pretty amazing tool - it's build on Selenium, and it's Selenium's headless browser automation, except not headless!

I use this tool for performing repetitive tasks that, for one reason or another, can't be done through an API or cURL or other scripting solution. Whether it's Blackboard's unreliable DOM (and the fact the college won't supply me with credentials), or Outlook Web's... peculiarities, this is how I avoid endless pointing and clicking and copying and pasting while still being able to supervise the process.

To run any of the scripts in this folder, install the UI.Vision browser extension, and click the button to create a new macro. Then simply click on the "Source View (JSON)" tab and paste in the contents of any of these files.

Since, naturally, you can't have comments in JSON files, notes for each script are described below:

- [Get Assignments](#get-assignments)
- [Notify](#notify)


### [Get Assignments](/uivision/get-assignments.json)

To run this macro, go to your course's Blackboard site, and then navigate to Grade Centre > Assignments, and select an attempt for an assignment. This macro runs sequentially, so to get all student attempts for the assignment, start with the first available.

This script checks to see if the student has multiple attempts for this assignment, in which case it will page through until it reaches the most recent.

When it finds a valid attempt, it will click the download button, and pause, allowing you time to save to the right folder, and, if necessary, add the student's name to the file name so that you don't have 50 files called "Lab 6". 

Once you've saved the file, click "Resume" in the UI.Vision window.

If you don't want to pause and resume after each file is saved, use the JSON in '[get-assignments-fast.json](/uivision/get-assignments-fast.json)'.


#### Get Assignments TODOs

- Blackboard will sometimes kick you back to the Assignments page, but inconsistently. Not sure how to get back to the next assignment.
- Having to resume the script is annoying. There are two reasons to pause the script: 
	1. I believe there's a bug in UI.Vision (I've seen similar bug reports), causing the double-click of the "Grade Next Item" button. Doesn't seem to be an issue in get-assignments-fast, but mitigated by the pause in get-assignments. 
	2. Adding student names to assignments - doing this with automation requires an extra module, I think, to interact with the system save dialog. There may be a workaround, but requires investigation.

### [Notify](/uivision/notify.json)

Script to send emails with custom database credentials to each student. Works in Outlook Web. Depends on `emailNotifications.csv` generate by `generate-db-emails.js` node script.

Note that since we need to use XClick and XType, this script will crap out every 12 loops, so... whatever, it's fine, since we're doing a manual click to send the actual emails, since we want to check the greeting in case we're not sure what constitutes a particular student's first name anyway.

## Node

### [Validate and Serve](/node/validate-and-serve.js)

Checks HTML against the W3C validation service. This requires serving the page with Express (which, I mean, you were going to look at the page anyway, right?).

Also [validates CSS](/utils/node/validateCSS.js), and [reports on media queries](/utils/node/report-media-queries.js), because mobile-first.

Should probably incorporate HTML-lint at some point (possibly making the code more modular - see notes in file).

### [Generate-db-emails](/node/generate-db-emails.js)

Depends on `studentinfo.json`, a file which is .gitignore'd here, for obvious reasons.

studentinfo.json is an array of object, each object referring to a student, with the following keys:

```
{
    "student number": "",
    "first name": "",
    "last name": "",
    "email": ""
}
```

`generate-db-emails` uses OpenSSL to generate a secure password for each student. (Could it be done with with Node's crypto? Yes, but it's not in a LTS node version yet, so...) It then creates an SQL script (`createStudentTables.sql`) which will create a database for each student, with permissions granted on the database based on the student number and generated password. It also creates a "demo" table within the database. 

Additionally, it creates a CSV file (`emailNotifications.csv`), which can be used with the UI.Vision script [Notify](#notify) to send personal emails to each student with the username and password for their new database.

### [unzip](node/unzip.js)

Students submit work in a variety of compressed formats, often including system files. This script does the following:

- Uncompresses `.zip`, `.rar` and `.7z` file formats to a duplicate directory.
- Were the files compressed in a folder? If not, put them in their own folder. If so, make sure they're not redundantly nested.
- Deletes junk system files and folders like `.DS_Store` and `__MACOSX`.
- Archives the originals.

### [assert HTML](node/assertHTML.js)

Injects a script into each HTML file in a folder. The script uses the browser's `console.assert` function to check for HTML elements, attributes, etc. based on requirements outlined in a JSON file ([example](examples/requirements.json)).

Run this script once, and open the file in the browser to quickly see if the student's webpage meets project requirements.

#### assert HTML TODO

Running this script multiple times will inject the script into the HTML files multiple times. Would be good to avoid this.

## Bash

### [nospaces](bash/nospaces.sh)

This is a script to recursively replace whitespace with underscores in all file and folder names in a directory. Students have a bad habit of adding spaces in their file and folder names, which is a pain when referencing them in scripts or in the command line. This makes things a little easier.

### [tomono](bash/tomono.sh)

I record my lectures with Quicktime.

Picture-in-picture workflow:
- `File > New Movie Recording` (opens a window feeding from the webcam)
- `View > Float on top` (keeps the webcam feed on top of all open windows)
- `File > New Screen Recording` (records your screen, including the webcam feed)

One quirk of Quicktime is that when you're using an external mic, it only records in mono to one channel. Weird, right? Anyway, this bash script is my workaround. 

Since I'll typically record multiple videos for a single lecture (because stretching and bathroom breaks happen), I'll save the videos with the following naming convention: {week number}-{sequence}, i.e. `8-2.mov` is the second video recording from my week 8 lecture.

Then all I need to do to fix the audio is to run the command `tomono 8`, and it will use `ffmpeg` to copy the audio to both channels for all the videos created for week 8.

#### tomono TODO

- I have commands commented out in [the file](bash/tomono.sh) that will also convert to mp4 and compress, I just haven't gotten around to testing them yet. Should help with my Premiere workflow.

### Coming soon
I have a bunch more tools already I'm working on incorporating into this repo. Stay tuned for:
- Diff student SQL queries with the answer key. (Currently needs modularization - in the `db-auto-grader` branch.)
- Connect to either a SQLite or MySQL database to diff the results from student queries and your answer key (including matching the number of rows and perfect matches). (Currently needs modularization - in the `db-auto-grader` branch.)
- Build a requirements checklist and quickly fill out a rubric (Needs... I dunno exactly. To be incorporated into the HTML validation workflow? Currently in the `checklist` branch.)
- Write once in Hugo to generate both slides & notes, deployed via Netlify. (Not checked in yet - still need to white label this.)