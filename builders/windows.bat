cd ..
rm sea-prep.blob
node --experimental-sea-config sea-config.json
mkdir binaries
move sea-prep.blob binaries/
cd binaries
rm archi-linter-win64.exe
node -e "require('fs').copyFileSync(process.execPath, 'archi-linter-win64.exe')"
signtool remove /s archi-linter-win64.exe
call npx postject archi-linter-win64.exe NODE_SEA_BLOB sea-prep.blob ^ --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
rm sea-prep.blob
REM signtool sign /fd SHA256 archi-linter-win64.exe
