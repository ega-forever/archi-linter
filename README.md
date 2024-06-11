# Archi-linter

Linter for Archi projects which use coArchi plugin.

## Installation

### Via npm
```bash
$ npm install -g archi-linter
```

## How does it work?
1) Run command in current Archi project (where `model` directory is located): ``archi-linter``
2) In case lint file hasn't been found, then linter will create one (`archilint.config.js`) with the following structure:
```
module.exports = {
  dir: './model',
  model: {
    Strategy: {},
    Business: {
      BusinessActor: {
        generic: {
          attrs: {},
          folders: []
        },
        'customers': {
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
        },
        'internal_users': {
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
        },
      },
      BusinessProcess: {
        generic: {
          attrs: {},
          folders: []
        },
        'org_process': {
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
        }
      },
    },
    'Implementation & Migration': {
      WorkPackage: {
        generic: {
          attrs: {},
          folders: []
        }
      }
    },
    Application: {
      ApplicationService: {
        generic: {
          attrs: {},
          folders: []
        }
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
3) the structure of the config looks like that:
```
{
  dir: <model_directory>,
  model: {
    <Archi_layer>: {
      <Archi_element>: {
        <Archi_specialization>: {
          attrs: [
            {
            <property_key>: {
              mandatpory: true | false,
              rule: regex | async function | undefined,
              similarValidator: async function | undefined
            },
            ...
          ],
          fodlers: [
            <folder_where_entity_with_this_specialization_should_be_located>,
            ...
          ]
       
        }
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


4) The core concept of archi-linter, is that each archi element may have different attributes and rules based on its specialization. 
For instance ``business actor`` may have 3 specializations (like `user_A`, `user_B`, `user_C`), each with its own fields
5) In case entity doesn't have any specialization (or you don't plan to use them), then you can simply replace `<Archi_specialization>` with reserved keyword `generic` like this:
````
{
  dir: <model_directory>,
  model: {
    <Archi_layer>: {
      <Archi_element>: {
        generic: {
          attrs: [
            {
            <property_key>: {
              mandatpory: true | false,
              rule: regex | async function | undefined,
              similarValidator: async function | undefined
            },
            ...
          ],
          fodlers: [
            <folder_where_entity_with_this_specialization_should_be_located>,
            ...
          ]
       
        }
      }
    }
  },
  ...
}
````
The linter will use rules under `generic` for entities without specified specialization. 
This also applies, when there are entities with and without specialization. So, you can specify specializations with their rules + specify `generic` specialization
6) the `attrs` contains the entity props. Each prop has its own validators. For now, there are 3 validators: 
   
| validator        | optional | format                                                                                                                                      | description                                                                                                                                                |
|----------------- | -------- |---------------------------------------------------------------------------------------------------------------------------------------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mandatory        |   false  | boolean (true or false)                                                                                                                     | check if property exists in the following entity (if set to true), if set to false - then marks this property as known (will be skipped by `unknownProps`) |
| rule             |   true   | regex (like `/APP-[0-9]{1,3}-[0-9]{1,3}[\.]{0,1}[0-9]{0,3}/g`) or async function ``async (prop_key, prop_value): boolean => true or false`` | checks if prop's value is correct                                                                                                                          |
| similarValidator |   true   | async function ``async (prop_key, prop_value, prop_values_of_other_entities): boolean=> true or false``                                     | checks if there are equal or similar values for the same property's key within the same specialization                                                     |

7) the ``folders`` contains the relative paths (like you see in Archi), where entities should be located. Useful, when you have a strict folder structure and want to follow it. This one is optional, and you can leave folders as empty array `[]`. 
8) the ``errors`` contains error settings per each error type:

| error                | default logLevel | default color | description                                                                                                                       |
|----------------------|------------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------|
| unknownProps         | 1                | "#fdd404"     | triggers, when prop hasn't been specified in `attrs` but was present in certain entity                                            |
| wrongPropValue       | 1                | "#fdd404"     | triggers, when `rule` has been specified for the certain prop and returned `false` (either by regex or with async function)       |
| missedMandatoryProp  | 1                | "#fdd404"     | triggers, when certain entity doesn't have prop, which was set as `mandatory: true`                                               |
| wrongFolder          | 1                | "#fdd404"     | triggers, when entity has been found under folder, which wasn't specified in `folders`. Will not trigger, when `folders` is empty |
| unregisteredEntities | 1                | "#fdd404"     | triggers, when linter found entities, which are not present in `archilint.config.js`                                              |
| similarEntities      | 1                | "#fdd404"     | triggers, when linter found similar or equal values for the same prop. key among all entities.                                    |

All error types may have 3 logLevels: 0 - mute error, 1 - warning, 2 - error. In case linter will find entities which falls under error with logLevel = 2, then linter will exist with status 1 (`process.exit(1)`). 
This behaviour is done, in order to make CI / git pre-hooks fail due to error (and not allow to push bad formatted model as a result) 
If any of the errors are not specified in config, then default setting will be used.

9) the `info` contains settings for stats output. The structure similar to errors. There are 2 kinds of `info`: `stats` - will display verbose output about scanned entities, and `summary` - will display stats about found errors


| stats                | default logLevel | default color | description                                        |
|----------------------|------------------|---------------|----------------------------------------------------|
| stat                 | 1                | "#25fd04"     | will display verbose output about scanned entities |
| summary              | 1                | "#0468fd"     | will display stats about found errors and warnings |

All stats types may have 2 logLevels: 0 - mute output, 1 - display output.
If any of the stats are not specified in config, then default setting will be used.


# License

[MIT](LICENSE)

# Copyright

Copyright (c) 2024 Egor Zuev
