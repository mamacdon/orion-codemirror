#!/bin/sh
cd ~/workspace/dev/foo/cr
git co gh-pages
git merge master
git push origin gh-pages
git co master
