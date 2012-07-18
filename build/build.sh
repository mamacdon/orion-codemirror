#!/bin/bash
outdir=../out
cwd=$(pwd)

if [[ ! -f "r.js" ]]; then
	echo "Couldn't find r.js (make sure you're running this from the 'build' directory)"
	exit 1
fi

if [[ ! -d "$outdir" ]]; then
	mkdir $outdir
fi

outdir=$(cd $outdir ; pwd)
if [[ "$outdir" == "$cwd" ]]; then
	echo "Refusing to use current directory"
	exit 1
else
	echo Cleaning "$outdir"...
	rm -rf $outdir
	echo "Running optimizer..."
	node r.js -o app.build.js

	echo "Done."
fi
exit 0