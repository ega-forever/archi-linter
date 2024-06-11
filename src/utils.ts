import fs from 'fs';
import path from 'path';

export const getAllXmlFilesInPath = (dir: string, fileList: string[] = []): string[] => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      fileList = getAllXmlFilesInPath(filepath, fileList);
    } else if (path.extname(filepath) === '.xml') {
      fileList.push(filepath);
    }
  }

  return fileList;
};
