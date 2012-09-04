#!/bin/bash
projDir=~/workspace/dev/foo/cr
buildDir=$projDir/build
outDir=$projDir/out

function check_err() {
	if [[ "$1" -ne "0" ]]; then
		echo $2
		exit $1
	fi
}

# reset gh-pages to latest in master
cd $projDir
echo "Checking out gh-pages..."
git checkout -f gh-pages
check_err $? "checkout failed."
echo "Resetting gh-pages to master..."
git reset --hard master
check_err $? "reset failed."

# run the build
cd $buildDir
./build.sh
check_err $? "Build failed."

# Commit the built code
git add $outDir
git commit -m "Update built code for gh-pages"

# Copy the resulting codeMirrorPlugin.html and lib/ to the toplevel project folder, so http://mamacdon.github.com/orion-codemirror/codeMirrorPlugin.html will work
cp $outDir/codeMirrorPlugin.html $projDir
cp -r $outDir/lib $projDir

# Commit the change from previous step
git add $projDir/codeMirrorPlugin.html
git add $projDir/lib
git commit -m "Copy built code to project root for gh-pages"

# clean up
git co master
git clean -df $projDir/codeMirrorPlugin.html
git clean -df $projDir/lib
git clean -df $projDir/out

echo 
echo To update the GitHub page, run:
echo 
echo git push -f origin gh-pages:refs/heads/gh-pages