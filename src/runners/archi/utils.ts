import { genericSpecialization, IModelElement } from '../../lib/interfaces';

declare var $: any;

const elementsInPath = (path, fullPath = '') => {
  const elements = $(path).children('element');
  const views = $(path).children('view');
  const subFolders = $(path).children('folder');
  const result = [...elements, ...views].map(el => ({
    id: el.id,
    name: el.name,
    specialization: el.specialization || genericSpecialization,
    type: toUpperCamelCase(el.type),
    props: el.prop().reduce((acc, current) => {
      acc[current] = el.prop(current);
      return acc;
    }, {}),
    path: fullPath
  }) as IModelElement);
  for (const subFolder of subFolders) {
    const foundElementsInPathNested = elementsInPath(subFolder, fullPath ? `${ fullPath }/${ subFolder.name }` : subFolder.name);
    result.push(...foundElementsInPathNested);
  }

  return result;
}

export const buildModelElementsFromArchi = async (): Promise<IModelElement[]> => {
  const folders = $('folder');

  const layersFolders = folders.toArray()
    .filter(f => $(f).parent('folder').length === 0);

  const totalElements: IModelElement[] = [];
  for (const layerFolder of layersFolders) {
    const foundElementsInPath = elementsInPath(layerFolder);
    totalElements.push(...foundElementsInPath);
  }

  return totalElements;
}

export const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

const toUpperCamelCase = (str: string) => {
  const camelCase = str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}