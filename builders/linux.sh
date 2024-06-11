#!/usr/bin/env bash

cd .. &&
rm sea-prep.blob || true
node --experimental-sea-config sea-config.json &&
mkdir binaries || true
mv sea-prep.blob binaries/
cd binaries
rm archi-linter-linux64 || true &&
cp $(command -v node) archi-linter-linux64  &&
npx postject archi-linter-linux64 NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
rm sea-prep.blob