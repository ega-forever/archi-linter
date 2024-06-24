# Archi-linter

Linter for Archi studio. 

Supports:
1) .archimate files
2) coArchi xml files (which are placed in ``model`` dir)
3) jArchi

## Installation

### Via npm
```bash
$ npm install -g archi-linter
```

### As standalone linter
Check [release page](https://github.com/ega-forever/archi-linter/releases)

### As jArchi script
1) Obtain a linter.ajs file from [release page](https://github.com/ega-forever/archi-linter/releases)
2) use it as a normal script in Archi studio
3) the script will place (and search) archilint.config.js in the same directory (where script is placed)

## How does it work?

### As standalone linter
1) download the binary file (linter) for your platform from the [release page](https://github.com/ega-forever/archi-linter/releases)
2) Run linter in current Archi project (for instance ``sh ./archi-linter``)
3) In case lint file hasn't been found, then linter will create one (`archilint.config.js`) with the following structure:
```
module.exports = {
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
    }
  }
}
```
4) the structure of the config looks like that:
```
{
  dir: <model_directory>,
  file: <archimate_file>,
  model: {
    <Archi_layer>: {
      <Archi_element>: {
        <Archi_specialization>: [
            {
              attrs: [
                {
                <property_key>: {
                  mandatpory: true | false,
                  rule: regex | async function | undefined,
                  similarValidator: async function | undefined
                },
                ...
              ],
              folders: [
                <folder_where_entity_with_this_specialization_should_be_located>,
                ...
              ]
            },
        ...
        ]
      }
    }
  },
  errors: {
    <errorType>: {
      logLevel: 0 | 1 | 2,
      color: <hex_format>
    }
  },
  info: {
    stat: {
      logLevel: 0 | 1,
      color: <hex_format>
    },
    summary: {
      logLevel: 0 | 1,
      color: <hex_format>
    },
    showEntities: {
      logLevel: 0 | 1,
      color: <hex_format>,
      entities: [
        <layer>.<entity_type>.<specialization>,
        ...
      ]
    }
  }
}
```
5) in case you use coArrchi, then specify model dir ``dir: <model_dir>``
6) in case you use archi (plain archi with .archimate file), then instead of ``dir`` key, specify .archimate file location ``file: <achimate_file_location>``
7) edit config according to your needs
8) run linter again. The linter will now use created config, validate the model and return output (like any linter do)

### as jArchi script
1) download linter.ajs from the [release page](https://github.com/ega-forever/archi-linter/releases)
2) run linter.ajs from archi studio
3) In case lint file hasn't been found, then linter will create one (`archilint.config.js`) with the following structure:
```
module.exports = {
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
```
4) the structure of the config looks like that:
```
{
  dir: <model_directory>,
  file: <archimate_file>,
  model: {
    <Archi_layer>: {
      <Archi_element>: {
        <Archi_specialization>: [
            {
              attrs: [
                {
                <property_key>: {
                  mandatpory: true | false,
                  rule: regex | async function | undefined,
                  similarValidator: async function | undefined
                },
                ...
              ],
              folders: [
                <folder_where_entity_with_this_specialization_should_be_located>,
                ...
              ]
            },
        ...
        ]
      }
    }
  },
  errors: {
    <errorType>: {
      logLevel: 0 | 1 | 2,
      color: <hex_format>
    }
  },
  info: {
    stat: {
      logLevel: 0 | 1,
      color: <hex_format>
    },
    summary: {
      logLevel: 0 | 1,
      color: <hex_format>
    }
  }
}
```
5) remove ``dir`` key from config (since script will use archi state from archi studio)
6) edit config according to your needs
7) run linter again. The linter will now use created config, validate the model and return output to scripts console (like any linter do)


### Linter concept

1) The core concept of archi-linter, is that each archi element may have different attributes and rules based on its specialization. 
For instance ``business actor`` may have 3 specializations (like `user_A`, `user_B`, `user_C`), each with its own fields. 
2) Furthermore, under each specialization, entities may have different set of props and can be placed in different directories. 
Archi-linter allows to specify several definitions for the same element's specialization (that is why it's an array). 
In order to find the suitable definition for the certain entity with the certain specialization, 
linter will filter out definitions by folders (just compare folders in definitions against entity's folder).
Also, this functionality can be useful for ``view`` element, since ``view`` doesn't have a specialization, but still can have props. In config you can do smth like that:
````
module.exports = {
  dir: './model',
  model: {
    ...
    Views: {
      ArchimateDiagramModel: {
        generic: [
          {
            attrs: {
              'Type': {
                mandatory: false
              },
              'Business_unit': {
                mandatory: false
              }
            },
            folders: [
              'Concepts/**'
            ]
          },
          {
            attrs: {
              'description': {
                mandatory: false
              },
              'domain': {
                mandatory: false
              },
            },
            folders: [
              'Architecture/**'
            ]
          },
          {
            attrs: {},
            folders: []
          }
        ]
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
    },
    similarEntities: {
      logLevel: 1,
      color: '#fdd404'
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
    }
  }
````
3) In case entity doesn't have any specialization (or you don't plan to use them), then you can simply replace `<Archi_specialization>` with reserved keyword `generic` like this:
````
{
  dir: <model_directory>,
  model: {
    <Archi_layer>: {
      <Archi_element>: {
        generic: [{
          attrs: [
            {
            <property_key>: {
              mandatpory: true | false,
              rule: regex | async function | undefined,
              similarValidator: async function | undefined
            },
            ...
          ],
          folders: [
            <folder_where_entity_with_this_specialization_should_be_located>,
            ...
          ]
       
        }]
      }
    }
  },
  ...
}
````
The linter will use rules under `generic` for entities without specified specialization. 
This also applies, when there are entities with and without specialization. So, you can specify specializations with their rules + specify `generic` specialization
4) the `attrs` contains the entity props. Each prop has its own validators. For now, there are 3 validators: 
   
| validator        | optional | format                                                                                                                                      | description                                                                                                                                                |
|----------------- | -------- |---------------------------------------------------------------------------------------------------------------------------------------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mandatory        |   false  | boolean (true or false)                                                                                                                     | check if property exists in the following entity (if set to true), if set to false - then marks this property as known (will be skipped by `unknownProps`) |
| rule             |   true   | regex (like `/APP-[0-9]{1,3}-[0-9]{1,3}[\.]{0,1}[0-9]{0,3}/g`) or async function ``async (prop_key, prop_value): boolean => true or false`` | checks if prop's value is correct                                                                                                                          |
| similarValidator |   true   | async function ``async (prop_key, prop_value, prop_values_of_other_entities): boolean=> true or false``                                     | checks if there are equal or similar values for the same property's key within the same specialization                                                     |

5) the ``folders`` contains the relative paths (like you see in Archi), where entities should be located. Wildcards can also be used in paths (like `Customers/**`).
Useful, when you have a strict folder structure and want to follow it. This one is optional, and you can leave folders as empty array `[]`.
6) the ``errors`` contains error settings per each error type:

| error                | default logLevel | default color | description                                                                                                                       |
|----------------------|------------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------|
| unknownProps         | 1                | "#fdd404"     | triggers, when prop hasn't been specified in `attrs` but was present in certain entity                                            |
| wrongPropValue       | 1                | "#fdd404"     | triggers, when `rule` has been specified for the certain prop and returned `false` (either by regex or with async function)       |
| missedMandatoryProp  | 1                | "#fdd404"     | triggers, when certain entity doesn't have prop, which was set as `mandatory: true`                                               |
| wrongFolder          | 1                | "#fdd404"     | triggers, when entity has been found under folder, which wasn't specified in `folders`. Will not trigger, when `folders` is empty |
| unregisteredEntities | 1                | "#fdd404"     | triggers, when linter found entities, which are not present in `archilint.config.js`                                              |
| similarEntities      | 1                | "#fdd404"     | triggers, when linter found similar or equal values for the same prop. key among all entities.                                    |

All error types may have 3 logLevels: 0 - mute error, 1 - warning, 2 - error. 
In case linter will find entities which falls under error with logLevel = 2, then linter will exist with status 1 (`process.exit(1)`).
Works only for standalone linter. This behaviour is done, in order to make CI / git pre-hooks fail due to error (and not allow to push bad formatted model as a result).
If any of the errors are not specified in config, then default setting will be used.

7) the `info` contains settings for stats output. The structure similar to errors. There are 2 kinds of `info`: `stats` - will display verbose output about scanned entities, and `summary` - will display stats about found errors


| stats        | default logLevel | default color | extra properties   | description                                                                                                                                                                                     |
|--------------|------------------|---------------|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| stat         | 1                | "#25fd04"     |                    | will display verbose output about scanned entities                                                                                                                                              |
| summary      | 1                | "#0468fd"     |                    | will display stats about found errors and warnings                                                                                                                                              |
| showEntities | 1                | "#fd0499"     | entities: string[] | will print entities with specified specialization. entities accept elements in the following format: ``<layer>.<entity_type>.<specialization>``, for example ``Business.BusinessActor.generic`` |

All stats types may have 2 logLevels: 0 - mute output, 1 - display output.
If any of the stats are not specified in config, then default setting will be used.


# License

[MIT](LICENSE)

# Copyright

Copyright (c) 2024 Egor Zuev
