#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { errorsDefaultConfig, infoLogDefaultConfig, StatTypes } from '../../lib/defaultConfigs';
import { buildModelElementsFromCoArchiXML } from './utils';
import * as vm from 'vm';
import exampleConfig from '../../lib/exampleConfig';
import lint from '../../lib/lint';
import messages from '../../lib/messages';

const init = async () => {
  const lintConfigPath = path.join(process.cwd(), 'archilint.config.js');

  if (!fs.existsSync(lintConfigPath)) {
    console.log('config hasn\'t been found in current dir, creating a new one...');
    fs.writeFileSync(lintConfigPath, exampleConfig);
    console.log('config created. Edit archilint.config.js according to your case and re-run the command');
    process.exit(0);
  }

  const lintConfigFile = fs.readFileSync(lintConfigPath, 'utf8');

  const vmModule = { exports: {} };
  const context = vm.createContext({
    exports: vmModule.exports,
    module: vmModule
  });

  const lintConfig = vm.runInNewContext(lintConfigFile, context);
  lintConfig.errors = Object.assign({}, errorsDefaultConfig, lintConfig.errors);
  lintConfig.info = Object.assign({}, infoLogDefaultConfig, lintConfig.info);


  const archiDir = path.isAbsolute(lintConfig.dir) ? lintConfig.dir : path.join(process.cwd(), lintConfig.dir);
  const modelElements = await buildModelElementsFromCoArchiXML(archiDir); // todo add condition for archimate file

  const lintResult = await lint({ elements: modelElements }, lintConfig);

  for (const outputLevel of Object.keys(lintResult)) {
    for (const outputKind of Object.keys(lintResult[outputLevel])) {
      for (const outputType of Object.keys(lintResult[outputLevel][outputKind])) {
        const outputTypeConfig = lintConfig[outputKind][outputType];
        const outputResults = lintResult[outputLevel][outputKind][outputType];

        for (const outputResult of outputResults) {
          console.log(
            chalk
              .hex(outputTypeConfig.color)
              .bold(messages[outputKind][outputLevel][outputType](outputResult.args))
          );
        }
      }
    }
  }

  const summaryErrors = lintResult.global.info[StatTypes.summary][0]?.args[1] || '0';

  if (parseInt(summaryErrors) === 0) {
    process.exit(1);
  }
};

export default init().catch(e => {
  console.log(e);
  process.exit(1);
});