export const genericSpecialization = 'generic'

export interface IModelElement {
  id: string;
  name: string;
  specialization: string | 'generic';
  type: string;
  props: { [key: string]: string };
  path: string;
}

export interface IModel {
  elements: Array<IModelElement>
}

export interface ILintConfig {
  dir: string;
  model: {
    [layer: string]: {
      [entityType: string]: {
        [specialization: string]: Array<{
          attrs: {
            [key: string]: {
              mandatory: boolean;
              rule?: RegExp | ((propKey: string, propValue: string) => Promise<boolean>);
              similarValidator?: ((propKey: string, propValue: string, otherEntitiesPropValues: string[]) => Promise<boolean>);
            };
          };
          folders: string[]
        }>
      }
    }
  },
  errors: {
    [errorType: string]: {
      logLevel: 0 | 1 | 2;
      color: string;
    }
  },
  info: {
    [infoType: string]: {
      logLevel: 0 | 1;
      color: string;
      entities?: string[];
    }
  }
}

export interface ILintResult {
  global: {
    info: {
      [key: string]: Array<{
        args: string[]
      }>
    },
    errors: {
      [key: string]: Array<{
        args: string[]
      }>
    }
  },
  entity: {
    errors: {
      [key: string]: Array<{
        args: string[]
      }>
    },
    info: {
      [key: string]: Array<{
        args: string[]
      }>
    }
  }

}