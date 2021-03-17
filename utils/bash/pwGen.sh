#!/bin/bash
OUTPUTFILE="output.txt"
END=${1:-1}
touch -a $OUTPUTFILE
for ((i=1;i<=$END;i++)); do
    openssl rand -base64 12 >> $OUTPUTFILE
done