import fetch from 'node-fetch';

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  url: string;
  author: string;
  mergedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListAllPullRequestsOptions {
  owner: string;
  name: string;
  token: string;
  states?: ('OPEN' | 'CLOSED' | 'MERGED')[];
  perPage?: number;
  maxPages?: number;
}

export async function listAllPullRequests(opts: ListAllPullRequestsOptions): Promise<PullRequest[]> {
  const {
    owner,
    name,
    token,
    states = ['OPEN'],
    perPage = 50,
    maxPages = 100
  } = opts;

  let after: string | null = null;
  let pagesFetched = 0;
  const all: PullRequest[] = [];

  while (pagesFetched < maxPages) {
    const query = `
      query ($owner:String!, $name:String!, $states:[PullRequestState!], $first:Int!, $after:String) {
        repository(owner:$owner, name:$name) {
          pullRequests(states:$states, first:$first, after:$after, orderBy:{ field: UPDATED_AT, direction: DESC }) {
            nodes {
              number
              title
              state
              url
              author { login }
              mergedAt
              createdAt
              updatedAt
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      owner,
      name,
      states,
      first: perPage,
      after
    };

    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'mcp-github-tools'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      throw new Error(`GitHub GraphQL API responded with ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    const connection = json.data.repository.pullRequests;
    const nodes = connection.nodes as any[];

    nodes.forEach(n => {
      all.push({
        number: n.number,
        title: n.title,
        state: n.state,
        url: n.url,
        author: n.author?.login,
        mergedAt: n.mergedAt,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt
      });
    });

    if (!connection.pageInfo.hasNextPage) break;

    after = connection.pageInfo.endCursor;
    pagesFetched += 1;
  }

  return all;
}
