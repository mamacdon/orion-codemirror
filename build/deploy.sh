#!/bin/bash

if [ ! "$#" -eq 1 ]; then
    echo >&2 "Usage: $0 [orion-codemirror repo directory]"
    exit 1
fi

projDir=$1
buildDir=build
outDir=out

function check_err() {
	if [[ "$1" -ne "0" ]]; then
		echo $2
		exit $1
	fi
}

# reset gh-pages to latest in master
pushd $projDir
echo "Checking out gh-pages..."
git checkout -f gh-pages
check_err $? "checkout failed."
echo "Resetting gh-pages to master..."
git reset --hard master
check_err $? "reset failed."

# run the build
pushd $buildDir
./build.sh
sleep 2
check_err $? "Build failed."
popd

# Commit the built code
git add $outDir
git commit -m "Update built code for gh-pages"

# Copy the resulting codeMirrorPlugin.html and js/ to the toplevel project folder, so http://mamacdon.github.io/orion-codemirror/codeMirrorPlugin.html will work
pushd $outDir
echo Copying $outDir/codeMirrorPlugin.html to $projDir
cp codeMirrorPlugin.html ../
cp -r ./js ../
popd

# Commit the change from previous step
git add codeMirrorPlugin.html
git add js
git commit -m "Copy built code to project root for gh-pages"

# clean up
git co master
git clean -df codeMirrorPlugin.html
git clean -df js
git clean -df out

echo 
echo To update the GitHub page, run:
echo 
echo cd "$projDir" "&&" git push -f origin gh-pages:refs/heads/gh-pages

#popd
#popd