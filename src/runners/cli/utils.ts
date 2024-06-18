import fs from 'fs';
import path from 'path';
import { genericSpecialization, IModelElement } from '../../lib/interfaces';
import xml2js from 'xml2js';
import { it } from 'node:test';

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

export const buildModelElementsFromCoArchiXML = async (archiDir: string): Promise<IModelElement[]> => {
  const parser = new xml2js.Parser();

  const files = getAllXmlFilesInPath(archiDir);
  const parsedData: Array<{
    id: string,
    name: string,
    specializations: Array<{
      id: string,
      name: string,
      href: string
    }>, // todo
    type: string,
    props: { [key: string]: string },
    filePath: string
  }> = [];

  for (const file of files) {
    const content = fs.readFileSync(file);
    const parsedContent = await parser.parseStringPromise(content.toString());
    const entityType = Object.keys(parsedContent)[0];
    const item = {
      id: parsedContent[entityType].$.id,
      name: parsedContent[entityType].$.name,
      specializations: parsedContent[entityType].profiles?.map(kv => kv.$) || [],
      type: entityType.replace('archimate:', ''),
      props: parsedContent[entityType]?.properties?.map(kv => kv.$)
          .filter(kv => kv)
          .reduce((acc, current) => {
            acc[current.key] = current.value;
            return acc;
          }, {})
        || {},
      filePath: file
    };
    parsedData.push(item);
  }


  const folders = parsedData
    .filter(it => it.type === 'Folder')
    .reduce((previousValue, current) => {
      previousValue.set(current.id, current.name);
      return previousValue;
    }, new Map());

  const specializations = parsedData.find(pd => pd.type === 'ArchimateModel')?.specializations || [];
  specializations.push({
    name: 'generic',
    id: null,
    href: null
  });


  return parsedData
    .filter(it => it.type !== 'Folder' && it.type !== 'ArchimateModel')
    .map(en => {
      const relativePath = path.relative(archiDir, en.filePath);
      const entityPath = path.parse(relativePath).dir
        .split(path.sep)
        .slice(1)
        .map(subPathId => folders.has(subPathId) ? folders.get(subPathId) : null)
        .join('/') || path.posix.sep;
      const specialization = en.specializations.map(pr => {
        const prId = pr.href.split('#')[1];
        return specializations.find(p => p.id === prId).name;
      })[0] || genericSpecialization;

      return {
        id: en.id,
        name: en.name,
        specialization,
        type: en.type,
        props: en.props,
        path: entityPath
      };
    });
}

const getAllElementsInArchiObject = (folderObj, fullPath = '') => {
  const folderElements = folderObj.element || [];
  const subFolders = folderObj.folder || [];

  const result = folderElements.map(item => {
    return {
      id: item.$.id,
      name: item.$.name,
      specialization: item.$.profiles,
      type: item.$['xsi:type'].replace('archimate:', ''),
      props: item.property?.reduce((acc, current) => {
        acc[current.$.key] = current.$.value;
        return acc;
      }, {}) || {},
      path: fullPath
    } as IModelElement
  });

  for (const subFolder of subFolders) {
    const foundElementsInPathNested = getAllElementsInArchiObject(subFolder, fullPath ? `${fullPath}/${subFolder.$.name}` : subFolder.$.name);
    result.push(...foundElementsInPathNested);
  }

  return result;
}

export const buildModelFromArchiFile = async (filePath: string): Promise<IModelElement[]> => {
  const parser = new xml2js.Parser();

  const content = fs.readFileSync(filePath);
  const parsedContent = await parser.parseStringPromise(content.toString());
  const model = parsedContent['archimate:model'];

  const foundElementsInPath = model.folder
    .map(f => getAllElementsInArchiObject(f))
    .reduce((acc, current) => [...acc, ...current], []);

  const specializations = model.profile?.map(pr => pr.$) || [];
  specializations.push({
    name: 'generic',
    id: null
  });

  return foundElementsInPath
    .map(en => {
      const specialization = specializations.find(p => p.id === en.specialization)?.name || genericSpecialization;
      return {
        id: en.id,
        name: en.name || '',
        specialization,
        type: en.type,
        props: en.props,
        path: en.path
      };
    });
}