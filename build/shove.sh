#!/bin/sh
projDir=~/workspace/dev/foo/cr
buildDir=$projDir/build
outDir=$projDir/out

cd $projDir

# merge in latest from master
echo git checkout gh-pages
echo git merge master

# run the build
cd $buildDir
./build.sh

buildresult=$?
if [[ ! $buildresult -eq 0 ]]; then
	echo Build failed.
	exit 1
fi

# copy the resulting codeMirrorPlugin.html and lib/ to the toplevel project folder, so http://mamacdon.github.com/orion-codemirror/codeMirrorPlugin.html will work
cd $outdir
cp codeMirrorPlugin.html ../
cp lib ../

# Commit the change from previous step
git add ../codeMirrorPlugin.html
git add ../lib
git commit -m "Copy built code to project root for gh-pages"

echo To update the GitHub page, run:
echo git push origin gh-pages
# echo git co master
