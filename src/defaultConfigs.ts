export enum ErrorTypes {
  unknownProps = 'unknownProps',
  wrongPropValue = 'wrongPropValue',
  missedMandatoryProp = 'missedMandatoryProp',
  wrongFolder = 'wrongFolder',
  unregisteredEntities = 'unregisteredEntities',
  similarEntities = 'similarEntities'
}

export enum StatTypes {
  stat = 'stat',
  summary = 'summary'
}


export const errorsDefaultConfig = {
  [ErrorTypes.unknownProps]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.wrongPropValue]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.missedMandatoryProp]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.wrongFolder]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.unregisteredEntities]: {
    logLevel: 1,
    color: '#fdd404'
  },
  [ErrorTypes.similarEntities]: {
    logLevel: 1,
    color: '#fdd404'
  }
};

export const infoLogDefaultConfig = {
  [StatTypes.stat]: {
    logLevel: 1,
    color: '#25fd04'
  },
  [StatTypes.summary]: {
    logLevel: 1,
    color: '#0468fd'
  }
};
