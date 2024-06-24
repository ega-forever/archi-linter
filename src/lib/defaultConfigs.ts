export enum ErrorTypes {
  UNKNOWN_PROPS = 'unknownProps',
  WRONG_PROP_VALUE = 'wrongPropValue',
  MISSED_MANDATORY_PROP = 'missedMandatoryProp',
  WRONG_FOLDER = 'wrongFolder',
  UNREGISTERED_ENTITIES = 'unregisteredEntities',
  SIMILAR_ENTITIES = 'similarEntities'
}

export enum StatTypes {
  STAT = 'stat',
  SHOW_ENTITIES = 'showEntities',
  SUMMARY = 'summary'
}


export const errorsDefaultConfig = {
  [ErrorTypes.UNKNOWN_PROPS]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.WRONG_PROP_VALUE]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.MISSED_MANDATORY_PROP]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.WRONG_FOLDER]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.UNREGISTERED_ENTITIES]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.SIMILAR_ENTITIES]: {
    logLevel: 1,
    color: '#fdd404'
  }
};

export const infoLogDefaultConfig = {
  [StatTypes.STAT]: {
    logLevel: 1,
    color: '#25fd04'
  },
  [StatTypes.SUMMARY]: {
    logLevel: 1,
    color: '#0468fd'
  },
  [StatTypes.SHOW_ENTITIES]: {
    logLevel: 1,
    color: '#fd0499',
    entities: []
  }
};
