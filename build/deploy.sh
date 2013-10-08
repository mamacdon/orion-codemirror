#!/bin/bash

if [ ! "$#" -eq 1 ]; then
#    echo >&2 "Usage: $0 [orion-codemirror repo directory]"
    echo >&2 "Usage: cat $0 | bash -s [orion-codemirror repo directory]"
    exit 1
fi

projDir=$1
buildDir=build
outDir=out

# Take master, build, commit built code to www.
# Then (prompt to) deploy to master ref on googlecode remote.
sourceRef=master
builtRef=www
deployRemote=googlecode
deployRemoteRef=master

function check_err() {
	if [[ "$1" -ne "0" ]]; then
		echo $2
		exit $1
	fi
}

# reset ${builtRef} to latest in ${sourceRef}
pushd $projDir
echo "Checking out ${builtRef}..."
git checkout -f ${builtRef}
check_err $? "checkout failed."
echo "Resetting ${builtRef} to ${sourceRef}..."
git reset --hard ${sourceRef}
check_err $? "reset failed."

# run the build
pushd $buildDir
./build.sh
sleep 2
check_err $? "Build failed."
popd

# Commit the built code
git add $outDir
git commit -m "Update built code for ${builtRef}"

# Copy the resulting codeMirrorPlugin.html and js/ to the toplevel project folder, so [webhost]/codeMirrorPlugin.html will work
pushd $outDir
echo Copying $outDir/codeMirrorPlugin.html to $projDir
cp codeMirrorPlugin.html ../
cp -r ./js ../
popd

# Commit the change from previous step
git add codeMirrorPlugin.html
git add js
git commit -m "Copy built code to project root for ${builtRef}"

# clean up
git checkout ${sourceRef}
git clean -df codeMirrorPlugin.html
git clean -df js
git clean -df out

echo 
echo To update the Google Code mirror, run:
echo 
echo cd "$projDir" "&&" git push -f ${deployRemote} ${builtRef}:refs/heads/${deployRemoteRef}

#popd
#popd
