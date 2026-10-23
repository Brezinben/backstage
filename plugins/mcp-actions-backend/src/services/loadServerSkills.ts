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
import type { LoggerService } from '@backstage/backend-plugin-api';
import { ForwardedError } from '@backstage/errors';
import { loadSkills } from '@modelcontextprotocol/server/ext/skills/node';

/**
 * Leaves the SDK `strict` option off: an invalid skill is skipped with a
 * warning, so that one bad skill does not stop the others from loading.
 */
export async function loadServerSkills(options: {
  directory: string;
  serverName: string;
  logger: LoggerService;
}) {
  const { directory, serverName, logger } = options;
  try {
    return await loadSkills(directory, {
      onWarning: ({ path, message }) =>
        logger.warn(`MCP server "${serverName}" skills: ${path}: ${message}`),
    });
  } catch (error) {
    throw new ForwardedError(
      `Failed to load the skills of MCP server "${serverName}" from "${directory}"`,
      error,
    );
  }
}
