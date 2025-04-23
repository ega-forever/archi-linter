import { ErrorTypes, StatTypes } from './defaultConfigs';

const entityDefinitionSubStr = (args: string[])=> `entity[${[args[0], args[1], args[2]].filter(ar=>ar).join('/')} (component - ${args[3]}, specialization - ${args[4]})]`;

export default {
  errors: {
    global: {
      [ErrorTypes.UNREGISTERED_ENTITIES]: (args: string[]) => `[unregistered] there are entities, for which lint rules are not specified in lint configuration file: ${args.join('; ')}`
    },
    entity: {
      [ErrorTypes.UNKNOWN_PROPS]: (args: string[]) => `[unknown props] ${entityDefinitionSubStr(args)} includes unknown props: ${args[5]}`,
      [ErrorTypes.WRONG_PROP_VALUE]: (args: string[]) => `[wrong props values] ${entityDefinitionSubStr(args)} includes wrong values: ${args[5]}`,
      [ErrorTypes.MISSED_MANDATORY_PROP]: (args: string[]) => `[missed mandatory fields] ${entityDefinitionSubStr(args)} doesn't include the required props: ${args[5]}`,
      [ErrorTypes.WRONG_FOLDER]: (args: string[]) => `[wrong folder] ${entityDefinitionSubStr(args)} is placed in unknown folder`,
      [ErrorTypes.SIMILAR_ENTITIES]: (args: string[]) => `[similar entity props] ${entityDefinitionSubStr(args)} has the following similar props: ${args[5]}`
    }
  },
  info: {
    global: {
      [StatTypes.SUMMARY]: (args: string[]) => `[model summary] total warnings: ${args[0]}, total errors: ${args[1]}, branch: ${args[2]}`,
      [StatTypes.STAT]: (args: string[]) => `[model info] found layer [${args[0]}] with entity (component - ${args[1]}, specialization - ${args[2]}) - ${args[3]} items`
    },
    entity: {
      [StatTypes.SHOW_ENTITIES]: (args: string[]) => `[entity info] ${entityDefinitionSubStr(args)}`
    }
  }
};
