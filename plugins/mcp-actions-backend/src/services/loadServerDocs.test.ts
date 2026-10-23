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
import {
  createMockDirectory,
  mockServices,
} from '@backstage/backend-test-utils';
import { loadServerDocs } from './loadServerDocs';

describe('loadServerDocs', () => {
  const mockDir = createMockDirectory();

  afterEach(() => {
    mockDir.clear();
  });

  it('should map each visible Markdown file to a docs:// URI and skip the others', async () => {
    mockDir.setContent({
      'getting-started.md': '# Getting started',
      'catalog/filters.md': '# Filters',
      'catalog/notes.txt': 'not Markdown',
      '.drafts/secret.md': '# Hidden folder',
      '.hidden.md': '# Hidden file',
    });

    const docs = await loadServerDocs({
      directory: mockDir.path,
      serverName: 'catalog',
      logger: mockServices.logger.mock(),
    });

    expect(docs).toEqual([
      {
        uri: 'docs://catalog/filters.md',
        name: 'catalog/filters.md',
        path: mockDir.resolve('catalog/filters.md'),
      },
      {
        uri: 'docs://getting-started.md',
        name: 'getting-started.md',
        path: mockDir.resolve('getting-started.md'),
      },
    ]);
  });

  it('should percent-encode each path segment of the URI', async () => {
    mockDir.setContent({ 'how to/read #1.md': '# Read' });

    const docs = await loadServerDocs({
      directory: mockDir.path,
      serverName: 'catalog',
      logger: mockServices.logger.mock(),
    });

    expect(docs.map(({ uri, name }) => ({ uri, name }))).toEqual([
      { uri: 'docs://how%20to/read%20%231.md', name: 'how to/read #1.md' },
    ]);
  });

  it('should skip a symbolic link and log a warning', async () => {
    mockDir.setContent({
      'guide.md': '# Guide',
      'linked.md': ctx => ctx.symlink('/etc/hostname'),
    });
    const logger = mockServices.logger.mock();

    const docs = await loadServerDocs({
      directory: mockDir.path,
      serverName: 'catalog',
      logger,
    });

    expect(docs.map(doc => doc.uri)).toEqual(['docs://guide.md']);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('linked.md'),
    );
  });

  it('should name the server and the directory when the directory cannot be read', async () => {
    const directory = mockDir.resolve('missing');

    await expect(
      loadServerDocs({
        directory,
        serverName: 'catalog',
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(
      `Failed to load the docs of MCP server "catalog" from "${directory}"`,
    );
  });
});
