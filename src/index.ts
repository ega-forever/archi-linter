#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import chalk from 'chalk';
import { errorsDefaultConfig, infoLogDefaultConfig } from './defaultConfigs';
import { getAllXmlFilesInPath } from './utils';
import SummaryStat from './summaryStat';
import * as vm from 'vm';
import exampleConfig from './exampleConfig';
import wc from 'wildcard-match';

const init = async () => {
  const lintConfigPath = path.join(process.cwd(), 'archilint.config.js');

  if (!fs.existsSync(lintConfigPath)) {
    console.log('config hasn\'t been found in current dir, creating a new one...');
    fs.writeFileSync(lintConfigPath, exampleConfig);
    console.log('config created. Edit archilint.config.js according to your case and re-run the command');
    process.exit(0);
  }

  const lintConfigFile = fs.readFileSync(lintConfigPath, 'utf8');

  const vmModule = { exports: {} };
  const context = vm.createContext({
    exports: vmModule.exports,
    module: vmModule
  });

  const lintConfig = vm.runInNewContext(lintConfigFile, context);

  const errorLogConfig = Object.assign({}, errorsDefaultConfig, lintConfig.errors);
  const infoLogConfig = Object.assign({}, infoLogDefaultConfig, lintConfig.info);
  const summaryStat = new SummaryStat();

  const archiDir = path.isAbsolute(lintConfig.dir) ? lintConfig.dir : path.join(process.cwd(), lintConfig.dir);

  const parser = new xml2js.Parser();

  const files = getAllXmlFilesInPath(archiDir);
  const parsedData: Array<{
    entityType: string
    realPath: string
    name: string
    id: string
    props: Array<{ key: string, value: string }>,
    profiles: Array<{ name: string, id: string, href?: string }>
  }> = [];

  for (const file of files) {
    const content = fs.readFileSync(file);
    const parsedContent = await parser.parseStringPromise(content.toString());
    const entityType = Object.keys(parsedContent)[0];
    const item = {
      entityType: entityType.replace('archimate:', ''),
      realPath: file,
      name: parsedContent[entityType].$.name,
      id: parsedContent[entityType].$.id,
      props: parsedContent[entityType]?.properties?.map(kv => kv.$).filter(kv => kv) || [],
      profiles: parsedContent[entityType].profiles?.map(kv => kv.$) || []
    };
    parsedData.push(item);
  }

  const folders = parsedData
    .filter(it => it.entityType === 'Folder')
    .reduce((previousValue, current) => {
      previousValue.set(current.id, current.name);
      return previousValue;
    }, new Map());

  const profiles = parsedData.find(pd => pd.entityType === 'ArchimateModel')?.profiles || [];
  profiles.push({
    name: 'generic',
    id: null
  });

  const entities = parsedData
    .filter(it => it.entityType !== 'Folder' && it.entityType !== 'ArchimateModel')
    .map(en => {
      const relativePath = path.relative(archiDir, en.realPath);
      const entityPath = path.parse(relativePath).dir
        .split(path.sep)
        .slice(1)
        .map(subPathId => folders.has(subPathId) ? folders.get(subPathId) : null)
        .join('/');
      const entityProfiles = en.profiles.map(pr => {
        const prId = pr.href.split('#')[1];
        return profiles.find(p => p.id === prId).name;
      });

      return {
        ...en,
        path: entityPath,
        profiles: entityProfiles
      };
    });

  const lintEntities = Object.values(lintConfig.model)
    .map(el => Object.keys(el))
    .reduce((prev, current) => {
      prev.push(...current);
      return prev;
    }, []);

  if (errorLogConfig.unregisteredEntities.logLevel > 0) {
    const unregisteredEntities = entities
      .map(pd => pd.entityType)
      .filter(en => !lintEntities.includes(en))
      .reduce((prev, current) => prev.add(current), new Set<string>());

    if (unregisteredEntities.size) {
      console.log(
        chalk
          .hex(errorLogConfig.unregisteredEntities.color)
          .bold(`there are entities, which are not specified in lint configuration file: ${[...unregisteredEntities].join(', ')}`)
      );

      summaryStat.incrementStat(errorLogConfig.unregisteredEntities.logLevel);
    }
  }

  for (const layerInLint of Object.keys(lintConfig.model)) {
    const entitiesInLayerInLint = Object.keys(lintConfig.model[layerInLint]);
    for (const entityInLayerInLint of entitiesInLayerInLint) {
      const profilesInEntityInLayerInLint = Object.keys(lintConfig.model[layerInLint][entityInLayerInLint]);
      for (const profile of profilesInEntityInLayerInLint) {
        const profileProps = lintConfig.model[layerInLint][entityInLayerInLint][profile];
        const archiEntities = entities.filter(en =>
          en.entityType === entityInLayerInLint &&
          (en.profiles.includes(profile) || (!en.profiles.length && profile === 'generic'))
        );

        if (infoLogConfig.stat.logLevel > 0) {
          console.log(
            chalk
              .hex(infoLogConfig.stat.color)
              .bold(`found layer [${layerInLint}] with entity (component - ${entityInLayerInLint}, profile - ${profile}) - ${archiEntities.length} items`)
          );
        }

        for (const archiEntity of archiEntities) {
          // validates that all mandatory props are exist
          const archiEntityPropKeys = archiEntity.props.map(ap => ap.key);

          if (errorLogConfig.missedMandatoryProp.logLevel > 0) {
            const missedLintMandatoryProps = Object.keys(profileProps.attrs)
              .filter(key => profileProps.attrs[key].mandatory && !archiEntityPropKeys.includes(key));

            if (missedLintMandatoryProps.length) {
              console.log(
                chalk
                  .hex(errorLogConfig.missedMandatoryProp.color)
                  .bold(`[missed mandatory fields] entity[${path.join(layerInLint, archiEntity.path, archiEntity.name)} (component - ${archiEntity.entityType}, profile - ${profile})] doesn't include the required props: ${missedLintMandatoryProps.join(', ')}`)
              );

              summaryStat.incrementStat(errorLogConfig.missedMandatoryProp.logLevel);
            }
          }

          // validates that there are no unknown props
          if (errorLogConfig.unknownProps.logLevel > 0) {
            const unknownPropsInEntity = archiEntityPropKeys
              .filter(pr => !profileProps.attrs[pr]);

            if (unknownPropsInEntity.length) {
              console.log(
                chalk
                  .hex(errorLogConfig.unknownProps.color)
                  .bold(`[unknown props] entity[${path.join(layerInLint, archiEntity.path, archiEntity.name)} (component - ${archiEntity.entityType}, profile - ${profile})] includes unknown props: ${unknownPropsInEntity.join(', ')}`)
              );

              summaryStat.incrementStat(errorLogConfig.unknownProps.logLevel);
            }
          }

          // validates rules per each prop (if rule is specified)
          if (errorLogConfig.wrongPropValue.logLevel > 0) {
            const wrongFormatForProps = [];
            for (const prop of archiEntity.props) {
              if (profileProps.attrs[prop.key]?.rule) {
                let isValid = true;
                if (profileProps.attrs[prop.key].rule.test) {
                  isValid = new RegExp(profileProps.attrs[prop.key].rule).test(prop.value);
                } else if (typeof profileProps.attrs[prop.key].rule === 'function') {
                  isValid = await profileProps.attrs[prop.key].rule(prop.key, prop.value);
                }

                if (!isValid) {
                  wrongFormatForProps.push(prop);
                }
              }
            }

            if (wrongFormatForProps.length) {
              console.log(
                chalk
                  .hex(errorLogConfig.wrongPropValue.color)
                  .bold(`[wrong props values] entity[${path.join(layerInLint, archiEntity.path, archiEntity.name)} (component - ${archiEntity.entityType}, profile - ${profile})] includes wrong values: ${wrongFormatForProps.map(pr => `{${pr.key}:${pr.value}}`).join(', ')}`)
              );

              summaryStat.incrementStat(errorLogConfig.wrongPropValue.logLevel);
            }
          }

          // validates that entity exists only in specified folders
          if (profileProps.folders.length && errorLogConfig.wrongFolder.logLevel > 0) {
            const isMatchFolder = profileProps.folders
              .map((f: string) => wc(f)(archiEntity.path))
              .find((result: boolean) => result);

            if (!isMatchFolder) {
              console.log(
                chalk
                  .hex(errorLogConfig.wrongFolder.color)
                  .bold(`[wrong folder] entity[${path.join(layerInLint, archiEntity.path, archiEntity.name)} (${archiEntity.entityType})] is placed in unknown folder`)
              );

              summaryStat.incrementStat(errorLogConfig.wrongFolder.logLevel);
            }
          }

          if (errorLogConfig.similarEntities.logLevel > 0) {
            const similarities: any = {};
            for (const prop of archiEntity.props) {
              if (profileProps.attrs[prop.key]?.similarValidator && typeof profileProps.attrs[prop.key]?.similarValidator === 'function') {
                const otherArchiEntitiesPropValues = archiEntities
                  .filter(ae => ae !== archiEntity)
                  .map(ae =>
                    ae.props.find(pr => pr.key === prop.key)?.value
                  )
                  .filter(pr => pr);

                const isSimilar = await profileProps.attrs[prop.key].similarValidator(prop.key, prop.value, otherArchiEntitiesPropValues);
                if (isSimilar) {
                  similarities[prop.key] = prop.value;
                }
              }
            }

            if (Object.keys(similarities).length) {
              console.log(
                chalk
                  .hex(errorLogConfig.similarEntities.color)
                  .bold(`[similar entity props] entity[${path.join(layerInLint, archiEntity.path, archiEntity.name)} (${archiEntity.entityType})] has the following similar props: ${JSON.stringify(similarities)}`)
              );

              summaryStat.incrementStat(errorLogConfig.similarEntities.logLevel);
            }

          }
        }
      }

    }
  }

  if (infoLogConfig.summary.logLevel > 0) {
    console.log(chalk.hex(infoLogConfig.summary.color)
      .bold(`total warnings: ${summaryStat.warnings} and total errors: ${summaryStat.errors}`));
  }

  if (summaryStat.errors) {
    process.exit(1);
  }
};

export default init().catch(e => {
  console.log(e);
  process.exit(1);
});