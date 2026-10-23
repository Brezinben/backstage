/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { resolve } from 'node:path';
import { mockServices } from '@backstage/backend-test-utils';
import { loadServerSkills } from './loadServerSkills';

const fixtures = resolve(__dirname, '../__fixtures__');

describe('loadServerSkills', () => {
  it('should skip an invalid skill and log a warning', async () => {
    const logger = mockServices.logger.mock();

    const skills = await loadServerSkills({
      directory: resolve(fixtures, 'invalid-skills'),
      serverName: 'catalog',
      logger,
    });

    expect(skills.entries.map(skill => skill.uri)).toEqual([
      'skill://find-entities/SKILL.md',
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('wrong-name'),
    );
  });

  it('should name the server and the directory when the directory cannot be read', async () => {
    const directory = resolve(fixtures, 'missing');

    await expect(
      loadServerSkills({
        directory,
        serverName: 'catalog',
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(
      `Failed to load the skills of MCP server "catalog" from "${directory}"`,
    );
  });
});
