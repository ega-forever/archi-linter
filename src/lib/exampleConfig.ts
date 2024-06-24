export default `module.exports = {
  dir: './model',
  model: {
    Strategy: {},
    Business: {
      BusinessActor: {
        generic: [{
          attrs: {},
          folders: []
        }],
        'customers': [{
          attrs: {
            code: {
              mandatory: true,
              rule: /customer-[0-9]{1,3}/g
            },
            comment: {
              mandatory: false
            }
          },
          folders: [
            'customers/common'
          ]
        }],
        'internal_users': [{
          attrs: {
            unit: {
              mandatory: true
            },
            short_name: {
              mandatory: true
            }
          },
          folders: [
            'units/backoffice',
            'units/frontoffice',
            'units/middleoffice'
          ]
        }]
      },
      BusinessProcess: {
        generic: [{
          attrs: {},
          folders: []
        }],
        'org_process': [{
          attrs: {
            name: {
              mandatory: true
            },
            process_number: {
              mandatory: true
            },
            owner: {
              mandatory: true
            },
          },
          folders: []
        }]
      }
    },
    'Implementation & Migration': {
      WorkPackage: {
        generic: [{
          attrs: {},
          folders: []
        }]
      }
    },
    Application: {
      ApplicationService: {
        generic: [{
          attrs: {},
          folders: []
        }]
      }
    }
  },
  errors: {
    unknownProps: {
      logLevel: 1,
      color: '#fdd404'
    },
    wrongPropValue: {
      logLevel: 1,
      color: '#fd0421'
    },
    missedMandatoryProp: {
      logLevel: 1,
      color: '#fd0463'
    },
    wrongFolder: {
      logLevel: 2,
      color: '#fd0404'
    }
  },
  info: {
    stat: {
      logLevel: 1,
      color: '#25fd04'
    },
    summary: {
      logLevel: 1,
      color: '#0c04fd'
    },
    showEntities: {
      logLevel: 1,
      color: '#fd0499',
      entities: [
        'Business.BusinessActor.generic'
      ]
    }
  }
}
`;