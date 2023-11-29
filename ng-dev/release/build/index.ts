/**
 * @license
 * Copyright Google LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { join } from 'path';
import {ChildProcess} from '../../utils/child-process.js'
import {BuiltPackage} from '../config/index.js';
import { determineRepoBaseDirFromCwd } from '../../utils/repo-directory.js';
import { readFile } from 'fs/promises';
import { Log } from '../../utils/logging.js';

/** The package.json structure. */
interface PackageJson {
  name: string;
};

/** Query for the list of all releasable targets in the repository. */
async function getReleasableTargetsList() {
  const spawnResult = await ChildProcess.spawn('yarn', ['bazel', 'query', '--output=label', `"kind(\'ng_package|pkg_npm\', //...) intersect attr(\'tags\', \'release-package\', //...)"`], {mode: 'silent'});
  if (spawnResult.status) {
    Log.error(spawnResult.stderr);
    throw Error('Failed to retrieve list of releasable targets, see details above.');
  }
  return spawnResult.stdout
    // Remove empty space
    .trim()
    // Each target is listed on a separate line
    .split('\n')
    // Remove any empty entries
    .filter(_ => !!_);
}

/** Generate the BuiltPackage object for the provided target which has already been built. */
async function getBuiltPackageForTarget(target: string): Promise<BuiltPackage> {
  // The full path to the directory containing the target output.
  const outputPath = join(determineRepoBaseDirFromCwd(), 'dist/bin', target.replace('//', '').replace(':', '/'))
  // The full path to the package.json of the target output's package.
  const packageJSONPath = join(outputPath, 'package.json');
  // The parsed package.json contents for the package.
  const packageJson = JSON.parse(await readFile(packageJSONPath, {encoding: 'utf-8'})) as PackageJson;
  
  return {
    name: packageJson.name,
    outputPath
}
}

/** Build all of the releasable targets in the repository */
export async function buildAllTargets() {
  // The releasable targets in the repo.
  const targets = await getReleasableTargetsList();
  // Stamping flags for the build.
  const stampFlags = ['--config=release']

  const spawnResult = await ChildProcess.spawn('yarn', ['bazel', 'build', ...stampFlags, ...targets], {mode: 'silent'});
  if (spawnResult.status) {
    Log.error(spawnResult.stderr);
    throw Error('Failed to build all of the targest as expected, see details above.');
  }

  return Promise.all(targets.map(getBuiltPackageForTarget));
}