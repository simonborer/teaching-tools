#!/bin/bash
DIRECTORY=.
for i in $DIRECTORY/${1}-*.mov; do
	ffmpeg -i ${i} -codec:v copy -ac 1 ${i}-mono.mov
done

# concat with semicolons (https://stackoverflow.com/questions/50318239/ffmpeg-concat-n-commands)

# convert to mp4 (https://mrcoles.com/convert-mov-mp4-ffmpeg/)

# compress with `ffmpeg -i 1-2.mov -vcodec libx265 -crf 24 output.mov`