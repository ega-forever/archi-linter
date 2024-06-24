import { errorsDefaultConfig, infoLogDefaultConfig } from '../../lib/defaultConfigs';
import { buildModelElementsFromArchi, hexToRgb } from './utils';
import exampleConfig from '../../lib/exampleConfig';
import lint from '../../lib/lint';
import messages from '../../lib/messages';
import { ILintConfig } from '../../lib/interfaces';

declare let $: any;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare let __DIR__: any;
declare let load: any;
declare let console: any;

const init = async () => {
  const lintConfigPath = `${__DIR__}archilint.config.js`;
  let lintConfig: ILintConfig;

  console.clear();

  try {
    lintConfig = load(lintConfigPath);
  } catch (e) {
    console.log(`config hasn't been found in current dir (${lintConfigPath}), creating a new one...`);

    $.fs.writeFile(lintConfigPath, exampleConfig, 'UTF8');
    console.log('config created. Edit archilint.config.js according to your case and re-run the command');
  }

  lintConfig.errors = Object.assign({}, errorsDefaultConfig, lintConfig.errors);
  lintConfig.info = Object.assign({}, infoLogDefaultConfig, lintConfig.info);

  const modelElements = await buildModelElementsFromArchi();

  const lintResult = await lint({ elements: modelElements }, lintConfig);
  const orderedOutputLevelAndKind = [
    'global.errors',
    'entity.errors',
    'global.info'
  ];

  for (const outputLevelAndKind of orderedOutputLevelAndKind) {
    const [level, kind] = outputLevelAndKind.split('.');
    for (const outputType of Object.keys(lintResult[level][kind])) {
      const outputTypeConfig = lintConfig[kind][outputType];
      const outputResults = lintResult[level][kind][outputType];

      const rgbColor = hexToRgb(outputTypeConfig.color);
      console.setTextColor(rgbColor.r, rgbColor.g, rgbColor.b);

      for (const outputResult of outputResults) {
        console.log(messages[kind][level][outputType](outputResult.args));
      }

      console.setDefaultTextColor();
    }
  }
};

export default init().catch(e => {
  console.log(e);
  process.exit(1);
});