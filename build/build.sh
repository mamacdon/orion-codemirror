#!/bin/bash
outdir=../out
cwd=$(pwd)
pathToRjs=../node_modules/requirejs/bin/r.js

if [[ ! -f "${pathToRjs}" ]]; then
	echo "Couldn't find r.js. Ensure you have run 'npm install' and you are calling this script from the 'build' directory."
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
	node "${pathToRjs}" -o app.build.js

	echo "Done."
fi
exit 0