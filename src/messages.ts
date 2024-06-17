import { ErrorTypes } from './defaultConfigs';
import { IModelElement } from './interfaces';

export default {
  errors: {
    [ErrorTypes.unknownProps]: (layer: string, entity: IModelElement, args: string[])=> `[unknown props] entity[${layer}/${entity.path}/${entity.name} (component - ${entity.type}, specialization - ${entity.specialization})] includes unknown props: ${args.join(', ')}`,
    [ErrorTypes.wrongPropValue]: (layer: string, entity: IModelElement, args: string[])=> `[wrong props values] entity[${layer}/${entity.path}/${entity.name} (component - ${entity.type}, specialization - ${entity.specialization})] includes wrong values: ${args.join(', ')}`,
    [ErrorTypes.missedMandatoryProp]: (layer: string, entity: IModelElement, args: string[]) => `[missed mandatory fields] entity[${layer}/${entity.path}/${entity.name} (component - ${entity.type}, specialization - ${entity.specialization})] doesn't include the required props: ${args.join(', ')}`,
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    [ErrorTypes.wrongFolder]: (layer: string, entity: IModelElement, args: string[]) => `[wrong folder] entity[${layer}/${entity.path}/${entity.name} (${entity.type})] is placed in unknown folder`,
    [ErrorTypes.unregisteredEntities]: (args: string[]) => `there are entities, for which lint rules are not specified in lint configuration file: ${args.join('; ')}`,
    [ErrorTypes.similarEntities]: (layer: string, entity: IModelElement, args: string[]) => `[similar entity props] entity[${layer}/${entity.path}/${entity.name} (${entity.type})] has the following similar props: ${args[0]}`
  },
  info: {

  }
}