#!/bin/bash
outdir=../out
cwd=$(pwd)
builddir=$( cd "$( dirname "$0" )" && pwd )
pathToRjs=${builddir}/../node_modules/requirejs/bin/r.js

if [[ ! -f "${pathToRjs}" ]]; then
	echo "Couldn't find r.js. Did you forget to run 'npm install'?"
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
	pushd ${builddir}
	node "${pathToRjs}" -o app.build.js

	echo "Done."
fi
exit 0

