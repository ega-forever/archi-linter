import { ErrorTypes, StatTypes } from './defaultConfigs';
import SummaryStat from './summaryStat';
import wc from 'wildcard-match';
import { ILintConfig, ILintResult, IModel } from './interfaces';

const lint = async (model: IModel, lintConfig: ILintConfig) => {
  const summaryStat = new SummaryStat();
  const lintResult: ILintResult = {
    global: {
      info: {
        [StatTypes.STAT]: [],
        [StatTypes.SUMMARY]: []
      },
      errors: {
        [ErrorTypes.UNREGISTERED_ENTITIES]: []
      }
    },
    entity: {
      errors: {
        [ErrorTypes.UNKNOWN_PROPS]: [],
        [ErrorTypes.WRONG_PROP_VALUE]: [],
        [ErrorTypes.MISSED_MANDATORY_PROP]: [],
        [ErrorTypes.WRONG_FOLDER]: [],
        [ErrorTypes.SIMILAR_ENTITIES]: []
      },
      info: {
        [StatTypes.SHOW_ENTITIES]: []
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

  if (lintConfig.errors.unregisteredEntities.logLevel > 0) {
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

      lintResult.global.errors[ErrorTypes.UNREGISTERED_ENTITIES].push({
        args: unregisteredEntitiesWithSpecializationsStr
      });

      summaryStat.incrementStat(lintConfig.errors.unregisteredEntities.logLevel);
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

        if (lintConfig.info.stat.logLevel > 0) {
          lintResult.global.info[StatTypes.STAT].push({
            args: [layerInLint, entityInLayerInLint, specialization, archiEntities.length.toString()]
          });
        }

        if (lintConfig.info.showEntities.logLevel > 0 && lintConfig.info.showEntities.entities?.includes(`${layerInLint}.${entityInLayerInLint}.${specialization}`)) {
          for (const archiEntity of archiEntities) {
            lintResult.entity.info[StatTypes.SHOW_ENTITIES].push({
              args: [layerInLint, archiEntity.path, archiEntity.name, archiEntity.type, archiEntity.specialization]
            });
          }
        }

        for (const archiEntity of archiEntities) {
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
            if (lintConfig.errors.wrongFolder.logLevel > 0) {
              lintResult.entity.errors[ErrorTypes.WRONG_FOLDER].push({
                args: [layerInLint, archiEntity.path, archiEntity.name, archiEntity.type, archiEntity.specialization]
              });

              summaryStat.incrementStat(lintConfig.errors.wrongFolder.logLevel);
            }

            continue;
          }

          const specializationPropsAttrs = Object.fromEntries(
            Object.entries(specializationProps.attrs)
              .filter(attrPair =>
                !model.gitBranch ||
                !attrPair[1].branches?.length ||
                !!attrPair[1].branches?.find((b: any) => b.test ? b.test(model.gitBranch) : b === model.gitBranch)
              )
          );

          // validates that all mandatory props are exist
          const archiEntityPropKeys = Object.keys(archiEntity.props)
            .filter(key =>
              !model.gitBranch ||
              !specializationProps.attrs[key]?.branches?.length ||
              !!specializationProps.attrs[key]?.branches?.find((b: any) => b.test ? b.test(model.gitBranch) : b === model.gitBranch)
            );

          if (lintConfig.errors.missedMandatoryProp.logLevel > 0) {
            const missedLintMandatoryProps = Object.keys(specializationPropsAttrs)
              .filter(key => specializationPropsAttrs[key].mandatory && !archiEntityPropKeys.includes(key));

            if (missedLintMandatoryProps.length) {
              lintResult.entity.errors[ErrorTypes.MISSED_MANDATORY_PROP].push({
                args: [layerInLint, archiEntity.path, archiEntity.name, archiEntity.type, archiEntity.specialization, missedLintMandatoryProps.join(', ')]
              });

              summaryStat.incrementStat(lintConfig.errors.missedMandatoryProp.logLevel);
            }
          }

          // validates that there are no unknown props
          if (lintConfig.errors.unknownProps.logLevel > 0) {
            const unknownPropsInEntity = archiEntityPropKeys
              .filter(pr => !specializationPropsAttrs[pr]);

            if (unknownPropsInEntity.length) {
              lintResult.entity.errors[ErrorTypes.UNKNOWN_PROPS].push({
                args: [layerInLint, archiEntity.path, archiEntity.name, archiEntity.type, archiEntity.specialization, unknownPropsInEntity.join(', ')]
              });

              summaryStat.incrementStat(lintConfig.errors.unknownProps.logLevel);
            }
          }

          // validates rules per each prop (if rule is specified)
          if (lintConfig.errors.wrongPropValue.logLevel > 0) {
            const wrongFormatForProps: Array<{ key: string, value: string }> = [];
            for (const propKey of Object.keys(archiEntity.props)) {
              if (specializationPropsAttrs[propKey]?.rule) {
                let isValid = true;
                // @ts-expect-error mute error for undefined key "test" since type can be not only regex
                if (specializationPropsAttrs[propKey].rule.test) {
                  isValid = new RegExp(specializationPropsAttrs[propKey].rule as RegExp).test(archiEntity.props[propKey]);
                } else if (typeof specializationPropsAttrs[propKey].rule === 'function') {
                  // @ts-expect-error ts doesn't recognize function interface
                  isValid = await specializationPropsAttrs[propKey].rule(propKey, archiEntity.props[propKey]);
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
              lintResult.entity.errors[ErrorTypes.WRONG_PROP_VALUE].push({
                args: [layerInLint, archiEntity.path, archiEntity.name, archiEntity.type, archiEntity.specialization, wrongFormatForProps.map(pr => `{${pr.key}:${pr.value}}`).join(', ')]
              });

              summaryStat.incrementStat(lintConfig.errors.wrongPropValue.logLevel);
            }
          }


          if (lintConfig.errors.similarEntities.logLevel > 0) {
            const similarities: { [key: string]: string } = {};
            for (const propKey of Object.keys(archiEntity.props)) {
              if (specializationPropsAttrs[propKey]?.similarValidator && typeof specializationPropsAttrs[propKey]?.similarValidator === 'function') {
                const otherArchiEntitiesPropValues = archiEntities
                  .filter(ae => ae !== archiEntity)
                  // eslint-disable-next-line @typescript-eslint/no-loop-func
                  .map(ae => ae.props[propKey])
                  .filter(pr => pr);

                const isSimilar = await specializationPropsAttrs[propKey].similarValidator(propKey, archiEntity.props[propKey], otherArchiEntitiesPropValues);
                if (isSimilar) {
                  similarities[propKey] = archiEntity.props[propKey];
                }
              }
            }

            if (Object.keys(similarities).length) {
              lintResult.entity.errors[ErrorTypes.SIMILAR_ENTITIES].push({
                args: [layerInLint, archiEntity.path, archiEntity.name, archiEntity.type, archiEntity.specialization, JSON.stringify(similarities)]
              });

              summaryStat.incrementStat(lintConfig.errors.similarEntities.logLevel);
            }
          }
        }
      }

    }
  }

  if (lintConfig.info.summary.logLevel > 0) {
    lintResult.global.info[StatTypes.SUMMARY].push({
      args: [summaryStat.warnings.toString(), summaryStat.errors.toString(), model.gitBranch]
    });
  }

  return { lintResult, summaryStat };
};

export default lint;