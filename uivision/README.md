# UI.Vision

[UI.Vision](https://ui.vision/) is a pretty amazing tool - it's build on Selenium, and it's Selenium's headless browser automation, except not headless!

I use this tool for performing repetitive tasks that, for one reason or another, can't be done through an API or cURL or other scripting solution. Whether it's Blackboard's unreliable DOM (and the fact the college won't supply me with credentials), or Outlook Web's... peculiarities, this is how I avoid endless pointing and clicking and copying and pasting while still being able to supervise the process.

To run any of the scripts in this folder, install the UI.Vision browser extension, and click the button to create a new macro. Then simply click on the "Source View (JSON)" tab and paste in the contents of any of these files.

Since, naturally, you can't have comments in JSON files, notes for each script are described below:

## Get Assignments

To run this macro, go to your course's Blackboard site, and then navigate to Grade Centre > Assignments, and select an attempt for an assignment. This macro runs sequentially, so to get all student attempts for the assignment, start with the first available.

This script checks to see if the student has multiple attempts for this assignment, in which case it will page through until it reaches the most recent.

When it finds a valid attempt, it will click the download button, and pause, allowing you time to save to the right folder, and, if necessary, add the student's name to the file name so that you don't have 50 files called "Lab 6". 

Once you've saved the file, click "Resume" in the UI.Vision window.

If you don't want to pause and resume after each file is saved, use the JSON in 'get-assignments-fast.json'.

### Get Assignments TODOs

> Blackboard will sometimes kick you back to the Assignments page, but inconsistently. Not sure how to get back to the next assignment.
> There are two reasons to pause the script: 1) I believe there's a bug in UI.Vision (I've seen similar bug reports), causing the double-click of the "Grade Next Item" button. Doesn't seem to be an issue in get-assignments-fast, but mitigated by the pause in get-assignments. 2) Adding student names to assignments - doing this with automation requires an extra module, I think, to interact with the system save dialog. There may be a workaround, but requires investigation.