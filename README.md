# teaching-tools

COVID brought new challenges to teaching. For me, that included the requirement to give personal feedback on 80-100 student assignments each week. Since I don't get paid to grade, finding ways to shave a minute or two off of the work of grading can translate into hours of personal time recovered each week.

This repo constitutes a variety of tools that have helped me find these efficiencies.

- [UI.Vision](#ui-vision)
- [Node](#node)

## UI.Vision

[UI.Vision](https://ui.vision/) is a pretty amazing tool - it's build on Selenium, and it's Selenium's headless browser automation, except not headless!

I use this tool for performing repetitive tasks that, for one reason or another, can't be done through an API or cURL or other scripting solution. Whether it's Blackboard's unreliable DOM (and the fact the college won't supply me with credentials), or Outlook Web's... peculiarities, this is how I avoid endless pointing and clicking and copying and pasting while still being able to supervise the process.

To run any of the scripts in this folder, install the UI.Vision browser extension, and click the button to create a new macro. Then simply click on the "Source View (JSON)" tab and paste in the contents of any of these files.

Since, naturally, you can't have comments in JSON files, notes for each script are described below:

- [Get Assignments](#get-assignments)
	- [Get Assignments TODO](#get-assignments-todos)
- [Notify](#notify)


### Get Assignments

To run this macro, go to your course's Blackboard site, and then navigate to Grade Centre > Assignments, and select an attempt for an assignment. This macro runs sequentially, so to get all student attempts for the assignment, start with the first available.

This script checks to see if the student has multiple attempts for this assignment, in which case it will page through until it reaches the most recent.

When it finds a valid attempt, it will click the download button, and pause, allowing you time to save to the right folder, and, if necessary, add the student's name to the file name so that you don't have 50 files called "Lab 6". 

Once you've saved the file, click "Resume" in the UI.Vision window.

If you don't want to pause and resume after each file is saved, use the JSON in 'get-assignments-fast.json'.

#### Get Assignments TODOs

- Blackboard will sometimes kick you back to the Assignments page, but inconsistently. Not sure how to get back to the next assignment.
- Having to resume the script is annoying. There are two reasons to pause the script: 
	1. I believe there's a bug in UI.Vision (I've seen similar bug reports), causing the double-click of the "Grade Next Item" button. Doesn't seem to be an issue in get-assignments-fast, but mitigated by the pause in get-assignments. 
	2. Adding student names to assignments - doing this with automation requires an extra module, I think, to interact with the system save dialog. There may be a workaround, but requires investigation.

### Notify

Script to send emails with custom database credentials to each student. Works in Outlook Web. Depends on `emailNotifications.csv` generate by `generate-db-emails.js` node script.

## Node

### Generate-db-emails

Depends on `studentinfo.json`, a file which is .gitignore'd here, for obvious reasons.

studentinfo.json is an array of object, each object referring to a student, with the following keys:

```{
    "student number": "",
    "first name": "",
    "last name": "",
    "email": ""
}```

`generate-db-emails` uses OpenSSL to generate a secure password for each student. It then creates an SQL script (`createStudentTables.sql`) which will create a database for each student, with permissions granted on the database based on the student number and generated password. It also creates a "demo" table within the database. 

Additionally, it creates a CSV file (`emailNotifications.csv`), which can be used with the UI.Vision script [Notify](#notify) to send personal emails to each student with the username and password for their new database.