#!/bin/bash
outdir=$(pwd)/out
if [[ -d "$outdir" ]]; then
    echo Cleaning "$outdir"...
    rm -rf $outdir
fi

echo "Running build, output folder: $outdir"
node r.js -o app.build.js
