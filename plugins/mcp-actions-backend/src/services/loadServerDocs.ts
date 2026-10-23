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
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export type ServerDoc = {
  uri: string;
  name: string;
  path: string;
};

/**
 * Lists the Markdown files of a directory once, at plugin start, so that a
 * client can only read a file that was listed. Symbolic links are skipped:
 * they could point outside the directory.
 */
export async function loadServerDocs(options: {
  directory: string;
  serverName: string;
  logger: LoggerService;
}): Promise<ServerDoc[]> {
  const { directory, serverName, logger } = options;
  const docs: ServerDoc[] = [];

  const walk = async (relativeDir: string[]) => {
    const entries = await readdir(join(directory, ...relativeDir), {
      withFileTypes: true,
    });
    for (const entry of entries.filter(e => !e.name.startsWith('.'))) {
      const segments = [...relativeDir, entry.name];
      const name = segments.join('/');
      if (entry.isSymbolicLink()) {
        logger.warn(
          `MCP server "${serverName}" docs: skipping symbolic link ${name}`,
        );
      } else if (entry.isDirectory()) {
        await walk(segments);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        docs.push({
          uri: `docs://${segments.map(encodeURIComponent).join('/')}`,
          name,
          path: join(directory, ...segments),
        });
      }
    }
  };

  try {
    await walk([]);
  } catch (error) {
    throw new ForwardedError(
      `Failed to load the docs of MCP server "${serverName}" from "${directory}"`,
      error,
    );
  }

  return docs.toSorted((a, b) => a.uri.localeCompare(b.uri));
}
