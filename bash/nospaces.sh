#!/bin/bash
if [ -z "$1" ];
  then
	find . -depth -name "* *" -execdir rename 's/ /_/g' "{}" \;
  else
	find $1 -depth -name "* *" -execdir rename 's/ /_/g' "{}" \;
fi

