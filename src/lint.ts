import chalk from 'chalk';
import { errorsDefaultConfig, ErrorTypes, infoLogDefaultConfig, StatTypes } from './defaultConfigs';
import SummaryStat from './summaryStat';
import wc from 'wildcard-match';
import { ILintConfig, ILintResult, IModel } from './interfaces';

const lint = async (model: IModel, lintConfig: ILintConfig) => {
  const errorLogConfig = Object.assign({}, errorsDefaultConfig, lintConfig.errors);
  const infoLogConfig = Object.assign({}, infoLogDefaultConfig, lintConfig.info);
  const summaryStat = new SummaryStat();
  const lintResult: ILintResult = {
    global: {
      summary: {
        [StatTypes.summary]: [],
        [StatTypes.stat]: []
      },
      errors: []
    },
    entity: {
      errors: {
        [ErrorTypes.unknownProps]: [],
        [ErrorTypes.wrongPropValue]: [],
        [ErrorTypes.missedMandatoryProp]: [],
        [ErrorTypes.wrongFolder]: [],
        [ErrorTypes.unregisteredEntities]: [],
        [ErrorTypes.similarEntities]: []
      }
    }
  };

  const lintEntitiesWithSpecializations = Object.values(lintConfig.model)
    .map(elementsInLayer => {
      const elementsInLayerNames = Object.keys(elementsInLayer);
      return elementsInLayerNames.map(eln => ({
        element: eln,
        specializations: Object.keys(elementsInLayer[eln])
      }));
    })
    .reduce((prev, current) => {
      prev.push(...current);
      return prev;
    }, []);

  if (errorLogConfig.unregisteredEntities.logLevel > 0) {
    const unregisteredEntitiesWithSpecializations = model.elements
      .filter(en => {
        const lintEntityDefinition = lintEntitiesWithSpecializations
          .find(le => le.element === en.type && le.specializations.includes(en.specialization));

        if (!lintEntityDefinition) {
          return {
            entityType: en.type,
            specialization: en.specialization
          };
        }
      })
      .reduce((acc, current) => {
        const elementFromMap = acc.get(current.type);
        if (!elementFromMap) {
          const specializationSet = new Set<string>();
          specializationSet.add(current.specialization);
          acc.set(current.type, specializationSet);
        } else {
          elementFromMap.add(current.specialization);
        }

        return acc;
      }, new Map<string, Set<string>>());

    if (unregisteredEntitiesWithSpecializations.size) {
      const unregisteredEntitiesWithSpecializationsStr = [...unregisteredEntitiesWithSpecializations.keys()]
        .reduce((prev, current) => {
          const elementSpecializations = `${current} (${[...unregisteredEntitiesWithSpecializations.get(current)].join(', ')})`;
          prev.push(elementSpecializations);
          return prev;
        }, new Array<string>());

      lintResult.global.errors[ErrorTypes.unregisteredEntities].push({
        errorArgs: unregisteredEntitiesWithSpecializationsStr
      });

      summaryStat.incrementStat(errorLogConfig.unregisteredEntities.logLevel);
    }
  }

  for (const layerInLint of Object.keys(lintConfig.model)) {
    const entitiesInLayerInLint = Object.keys(lintConfig.model[layerInLint]);
    for (const entityInLayerInLint of entitiesInLayerInLint) {
      const specializationsInEntityInLayerInLint = Object.keys(lintConfig.model[layerInLint][entityInLayerInLint]);
      for (const specialization of specializationsInEntityInLayerInLint) {
        const specializationPropsDefinitions = lintConfig.model[layerInLint][entityInLayerInLint][specialization];
        if (!specializationPropsDefinitions.length) {
          continue;
        }

        const archiEntities = model.elements.filter(en =>
          en.type === entityInLayerInLint && en.specialization === specialization);

        if (infoLogConfig.stat.logLevel > 0) {
          console.log(
            chalk
              .hex(infoLogConfig.stat.color)
              .bold(`found layer [${layerInLint}] with entity (component - ${entityInLayerInLint}, specialization - ${specialization}) - ${archiEntities.length} items`)
          );
        }

        for (const archiEntity of archiEntities) {
          // validates that all mandatory props are exist
          const archiEntityPropKeys = Object.keys(archiEntity.props);


          const specializationProps = specializationPropsDefinitions
            .sort((defA, defB) => defB.folders.length - defA.folders.length)
            .find(def => {
              const isMatchFolder = def.folders
                .map((f: string) => wc(f)(archiEntity.path))
                .find((comparatorResult: boolean) => comparatorResult);

              return isMatchFolder || def.folders.length === 0;
            });


          // validates that entity exists only in specified folders
          if (!specializationProps) {
            if (errorLogConfig.wrongFolder.logLevel > 0) {
              lintResult.entity.errors[ErrorTypes.wrongFolder].push({
                layer: layerInLint,
                element: archiEntity,
                errorArgs: []
              });

              summaryStat.incrementStat(errorLogConfig.wrongFolder.logLevel);
            }

            continue;
          }

          if (errorLogConfig.missedMandatoryProp.logLevel > 0) {
            const missedLintMandatoryProps = Object.keys(specializationProps.attrs)
              .filter(key => specializationProps.attrs[key].mandatory && !archiEntityPropKeys.includes(key));

            if (missedLintMandatoryProps.length) {
              lintResult.entity.errors[ErrorTypes.missedMandatoryProp].push({
                layer: layerInLint,
                element: archiEntity,
                errorArgs: missedLintMandatoryProps
              });

              summaryStat.incrementStat(errorLogConfig.missedMandatoryProp.logLevel);
            }
          }

          // validates that there are no unknown props
          if (errorLogConfig.unknownProps.logLevel > 0) {
            const unknownPropsInEntity = archiEntityPropKeys
              .filter(pr => !specializationProps.attrs[pr]);

            if (unknownPropsInEntity.length) {
              lintResult.entity.errors[ErrorTypes.unknownProps].push({
                layer: layerInLint,
                element: archiEntity,
                errorArgs: unknownPropsInEntity
              });

              summaryStat.incrementStat(errorLogConfig.unknownProps.logLevel);
            }
          }

          // validates rules per each prop (if rule is specified)
          if (errorLogConfig.wrongPropValue.logLevel > 0) {
            const wrongFormatForProps: Array<{ key: string, value: string }> = [];
            for (const propKey of Object.keys(archiEntity.props)) {
              if (specializationProps.attrs[propKey]?.rule) {
                let isValid = true;
                // @ts-expect-error ts doesn't recognize test method in regex somehow
                if (specializationProps.attrs[prop.key].rule.test) {
                  isValid = new RegExp(specializationProps.attrs[propKey].rule as RegExp).test(archiEntity.props[propKey]);
                } else if (typeof specializationProps.attrs[propKey].rule === 'function') {
                  // @ts-expect-error ts doesn't recognize function interface
                  isValid = await specializationProps.attrs[prop.key].rule(prop.key, prop.value);
                }

                if (!isValid) {
                  wrongFormatForProps.push({
                    key: propKey,
                    value: archiEntity.props[propKey]
                  });
                }
              }
            }

            if (wrongFormatForProps.length) {
              lintResult.entity.errors[ErrorTypes.wrongPropValue].push({
                layer: layerInLint,
                element: archiEntity,
                errorArgs: wrongFormatForProps.map(pr => `{${pr.key}:${pr.value}}`)
              });

              summaryStat.incrementStat(errorLogConfig.wrongPropValue.logLevel);
            }
          }


          if (errorLogConfig.similarEntities.logLevel > 0) {
            const similarities: { [key: string]: string } = {};
            for (const propKey of Object.keys(archiEntity.props)) {
              if (specializationProps.attrs[propKey]?.similarValidator && typeof specializationProps.attrs[propKey]?.similarValidator === 'function') {
                const otherArchiEntitiesPropValues = archiEntities
                  .filter(ae => ae !== archiEntity)
                  // eslint-disable-next-line @typescript-eslint/no-loop-func
                  .map(ae => ae.props[propKey])
                  .filter(pr => pr);

                const isSimilar = await specializationProps.attrs[propKey].similarValidator(propKey, archiEntity.props[propKey], otherArchiEntitiesPropValues);
                if (isSimilar) {
                  similarities[propKey] = archiEntity.props[propKey];
                }
              }
            }

            if (Object.keys(similarities).length) {
              lintResult.entity.errors[ErrorTypes.similarEntities].push({
                layer: layerInLint,
                element: archiEntity,
                errorArgs: [JSON.stringify(similarities)]
              });

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

  return lintResult;
};

export default lint;