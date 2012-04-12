#!/bin/bash

EXPECTED_ARGS=1
if [ $# -ne $EXPECTED_ARGS ]
then
    echo "Usage: build [output directory]"
    exit 1
fi

mydir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
out=$1
out="$( cd "${out}" && pwd )"

if [ ! -d "$mydir" ]
then
    echo "build: couldn't find script working directory '${mydir}'"
    exit 3
fi

if [ "$out" = "$mydir" ]
then
    echo "build: source and target directories are the same."
    exit 4
fi

if [ ! -d "$out" ]
then
    mkdir ${out}
fi

cp -fR ${mydir}/* ${out}
rm ${out}/lib/codemirror2
echo "Built to ${out}."

