import { describe, it, expect } from "vitest";
import nock from 'nock';
import { listAllPullRequests, PullRequest } from '../src/github_pr_list_paginated';

describe('listAllPullRequests', () => {
  it('fetches all pages of pull requests', async () => {
    const owner = 'octocat';
    const name = 'hello-world';
    const token = 'ghp_test';

    const graphqlPath = '/graphql';

    // Helper to match successive requests regardless of cursor value
    const queryInterceptor = (body: any) => {
      return body.query.includes('pullRequests') && body.variables.owner === owner;
    };

    // First page: one PR and a cursor indicating more pages
    nock('https://api.github.com')
      .post(graphqlPath, queryInterceptor)
      .reply(200, {
        data: {
          repository: {
            pullRequests: {
              nodes: [
                {
                  number: 1,
                  title: 'feat: add hello world',
                  state: 'OPEN',
                  url: 'https://github.com/octocat/hello-world/pull/1',
                  author: { login: 'alice' },
                  mergedAt: null,
                  createdAt: '2025-07-30T00:00:00Z',
                  updatedAt: '2025-07-30T00:01:00Z'
                }
              ],
              pageInfo: {
                endCursor: 'CURSOR1',
                hasNextPage: true
              }
            }
          }
        }
      });

    // Second (final) page: another PR, hasNextPage = false
    nock('https://api.github.com')
      .post(graphqlPath, queryInterceptor)
      .reply(200, {
        data: {
          repository: {
            pullRequests: {
              nodes: [
                {
                  number: 2,
                  title: 'fix: improve docs',
                  state: 'OPEN',
                  url: 'https://github.com/octocat/hello-world/pull/2',
                  author: { login: 'bob' },
                  mergedAt: null,
                  createdAt: '2025-07-30T00:02:00Z',
                  updatedAt: '2025-07-30T00:03:00Z'
                }
              ],
              pageInfo: {
                endCursor: null,
                hasNextPage: false
              }
            }
          }
        }
      });

    const prs: PullRequest[] = await listAllPullRequests({ owner, name, token, states: ['OPEN'], perPage: 1 });

    expect(prs).toHaveLength(2);
    expect(prs.map(p => p.number)).toEqual([1, 2]);
  });
});
