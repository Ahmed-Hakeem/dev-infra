/**
 * @license
 * Copyright Google LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// ---- **IMPORTANT** ----
// This command is part of our external commands invoked by the release publish
// command. Before making changes, keep in mind that more recent `ng-dev` versions
// can still invoke this command.
// ------------------------

import {Argv, Arguments, CommandModule} from 'yargs';

import {getConfig} from '../../utils/config.js';
import {green, Log} from '../../utils/logging.js';
import {assertValidReleaseConfig, BuiltPackage} from '../config/index.js';
import { buildAllTargets } from './index.js';



/**
 * Type describing the JSON output of this command.
 *
 * @important When changing this, make sure the release action
 *   invocation is updated as well.
 */
export type ReleaseBuildJsonStdout = BuiltPackage[];

/** Command line options for building a release. */
export interface ReleaseBuildOptions {
  json: boolean;
}

/** Yargs command builder for configuring the `ng-dev release build` command. */
function builder(argv: Argv): Argv<ReleaseBuildOptions> {
  return argv.option('json', {
    type: 'boolean',
    description: 'Whether the built packages should be printed to stdout as JSON.',
    default: false,
  });
}

/** Yargs command handler for building a release. */
async function handler(args: Arguments<ReleaseBuildOptions>) {
  const builtPackages = await buildAllTargets();
  
  if (args.json) {
    process.stdout.write(JSON.stringify(<ReleaseBuildJsonStdout>builtPackages, null, 2));
  } else {
    Log.info(green('  ✓   Built release packages.'));
    builtPackages.forEach(({name}) => Log.info(green(`      - ${name}`)));
  }
  
}

/** CLI command module for building release output. */
export const ReleaseBuildCommandModule: CommandModule<{}, ReleaseBuildOptions> = {
  builder,
  handler,
  command: 'build',
  describe: 'Builds the release output for the current branch.',
};
