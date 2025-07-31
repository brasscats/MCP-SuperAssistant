import { describe, it, expect } from 'vitest';
import nock from 'nock';
import { listPullRequests, PullRequest } from '../src/github_pr_list';

describe('listPullRequests', () => {
  it('fetches open pull requests for repository', async () => {
    const owner = 'octocat';
    const name = 'hello-world';
    const token = 'ghp_test';

    // Intercept GitHub GraphQL API call
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {
        data: {
          repository: {
            pullRequests: {
              nodes: [
                {
                  number: 42,
                  title: 'Improve docs',
                  state: 'OPEN',
                  url: 'https://github.com/octocat/hello-world/pull/42',
                  author: { login: 'monalisa' },
                  mergedAt: null,
                  createdAt: '2025-07-30T00:00:00Z',
                  updatedAt: '2025-07-30T00:01:00Z'
                }
              ]
            }
          }
        }
      });

    const prs: PullRequest[] = await listPullRequests({ owner, name, token, states: ['OPEN'] });

    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({
      number: 42,
      title: 'Improve docs',
      state: 'OPEN'
    });
  });
});
