import { ErrorTypes, StatTypes } from './defaultConfigs';
import { IModelElement } from './interfaces';

const entityDefinitionSubStr =(args: string[])=> `entity[${[args[0], args[1], args[2]].filter(ar=>ar).join('/')} (component - ${args[3]}, specialization - ${args[4]})]`;

export default {
  errors: {
    global: {
      [ErrorTypes.unregisteredEntities]: (args: string[]) => `there are entities, for which lint rules are not specified in lint configuration file: ${args.join('; ')}`
    },
    entity: {
      [ErrorTypes.unknownProps]: (args: string[]) => `[unknown props] ${entityDefinitionSubStr(args)} includes unknown props: ${args[5]}`,
      [ErrorTypes.wrongPropValue]: (args: string[]) => `[wrong props values] ${entityDefinitionSubStr(args)} includes wrong values: ${args[5]}`,
      [ErrorTypes.missedMandatoryProp]: (args: string[]) => `[missed mandatory fields] ${entityDefinitionSubStr(args)} doesn't include the required props: ${args[5]}`,
      [ErrorTypes.wrongFolder]: (args: string[]) => `[wrong folder] ${entityDefinitionSubStr(args)} is placed in unknown folder`,
      [ErrorTypes.similarEntities]: (args: string[]) => `[similar entity props] ${entityDefinitionSubStr(args)} has the following similar props: ${args[5]}`
    }
  },
  info: {
    global: {
      [StatTypes.summary]: (args: string[]) => `total warnings: ${args[0]} and total errors: ${args[1]}`,
      [StatTypes.stat]: (args: string[]) => `found layer [${args[0]}] with entity (component - ${args[1]}, specialization - ${args[2]}) - ${args[3]} items`
    }
  }
};
