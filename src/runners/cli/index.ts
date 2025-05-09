#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { errorsDefaultConfig, infoLogDefaultConfig, StatTypes } from '../../lib/defaultConfigs';
import { buildModelElementsFromCoArchiXML, buildModelFromArchiFile, getCurrentGitBranch } from './utils';
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
    module: vmModule,
    process: {
      env: process.env
    },
    path
  });

  const lintConfig = vm.runInNewContext(lintConfigFile, context);
  lintConfig.errors = Object.assign({}, errorsDefaultConfig, lintConfig.errors);
  lintConfig.info = Object.assign({}, infoLogDefaultConfig, lintConfig.info);

  let modelElements = [];
  let gitBranch = null;

  if (lintConfig.file) {
    const filePath = path.isAbsolute(lintConfig.file) ? lintConfig.file : path.join(process.cwd(), lintConfig.file);
    modelElements = await buildModelFromArchiFile(filePath);
  } else if (lintConfig.dir) {
    const archiDir = path.isAbsolute(lintConfig.dir) ? lintConfig.dir : path.join(process.cwd(), lintConfig.dir);
    modelElements = await buildModelElementsFromCoArchiXML(archiDir);
    gitBranch = process.env.ARCHI_LINTER_GIT_BRANCH || await getCurrentGitBranch(archiDir).catch(() => null);
  }

  const { lintResult, summaryStat } = await lint({ elements: modelElements, gitBranch }, lintConfig);
  const orderedOutputLevelAndKind = [
    'global.errors',
    'entity.errors',
    'entity.info',
    'global.info'
  ];

  for (const outputLevelAndKind of orderedOutputLevelAndKind) {
    const [level, kind] = outputLevelAndKind.split('.');
    for (const outputType of Object.keys(lintResult[level][kind])) {
      const outputTypeConfig = lintConfig[kind][outputType];
      const outputResults = lintResult[level][kind][outputType];

      for (const outputResult of outputResults) {
        console.log(
          chalk
            .hex(outputTypeConfig.color)
            .bold(messages[kind][level][outputType](outputResult.args))
        );
      }
    }
  }

  if (summaryStat.errors > 0) {
    process.exit(1);
  }
};

export default init().catch(e => {
  console.log(e);
  process.exit(1);
});