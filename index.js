const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');


const getAllXmlFilesInPath = (dir, fileList = []) => {
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
}

const init = async () => {

  const archiDir = path.join(process.cwd(), '../backend/backend/model');

  const linter = JSON.parse(fs.readFileSync('config.json').toString());

  const parser = new xml2js.Parser();

  const files = getAllXmlFilesInPath(archiDir);
  const parsedData = [];

  for (const file of files) {
    const content = fs.readFileSync(file);
    const parsedContent = await parser.parseStringPromise(content.toString());
    const entityType = Object.keys(parsedContent)[0];
    const item = {
      entityType: entityType.replace('archimate:', ''),
      realPath: file,
      name: parsedContent[entityType]['$'].name,
      id: parsedContent[entityType]['$'].id,
      props: parsedContent[entityType]?.properties?.map(kv => kv['$']) || [],
      profiles: parsedContent[entityType].profiles?.map(kv => kv['$']) || []
    }
    parsedData.push(item);
  }

  const folders = parsedData
    .filter(it => it.entityType === 'Folder')
    .reduce((previousValue, current) => {
      previousValue.set(current.id, current.name);
      return previousValue;
    }, new Map())

  const entities = parsedData
    .filter(it => it.entityType !== 'Folder' && it.entityType !== 'ArchimateModel')
    .map(en => {
      const relativePath = path.relative(archiDir, en.realPath);
      en.path = path.parse(relativePath).dir
        .split(path.sep)
        .slice(1)
        .map(subPathId => folders.has(subPathId) ? folders.get(subPathId) : null)
        .join('/')

      return en;
    });

  const profiles = parsedData.find(pd => pd.entityType === 'ArchimateModel')?.profiles || [];
  profiles.push({
    name: 'generic',
    id: null
  });

  const lintEntities = Object.values(linter)
    .map(el => Object.keys(el)[0])
    .filter(el => el);

  const archiEntities = entities.map(pd => pd.entityType).reduce((prev, current) => prev.add(current), new Set());
  const unregisteredEntities = [ ...archiEntities ].filter(en => !lintEntities.includes(en));

  // todo chalk (warn) that there are entities, which are not specified in lint configuration file: <entities>
  // console.log(`there are entities, which are not specified in lint configuration file: ${unregisteredEntities.join(', ')}`);


  /* const businessActor = parsedData.find(item=> item[`archimate:BusinessActor`]);

   const name = businessActor[`archimate:BusinessActor`]['$'].name;
   const props = businessActor[`archimate:BusinessActor`].properties.map(kv=>kv['$']);
   const profiles = businessActor[`archimate:BusinessActor`].profiles.map(kv=>kv['$']);

   const linterBaRules = linter.Business.businessActor;

   console.log(name);
   console.log(props);
   console.log(profiles);
   console.log(linterBaRules);*/

  // todo validate all mandatory props exist
  // todo validate that there are no unknown props
  // todo validate rules per each prop (if rule is specified)
  // todo validate that entity exists only in specified folders


}

module.exports = init().catch(e => console.log(e));