import fetch from 'node-fetch';

export interface ListPullRequestsOptions {
  owner: string;
  name: string;
  token: string;
  states?: ('OPEN' | 'CLOSED' | 'MERGED')[];
  first?: number;
}

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

export async function listPullRequests(opts: ListPullRequestsOptions): Promise<PullRequest[]> {
  const { owner, name, token, states = ['OPEN'], first = 20 } = opts;

  const query = `
    query ($owner:String!, $name:String!, $states:[PullRequestState!], $first:Int!) {
      repository(owner:$owner, name:$name) {
        pullRequests(states:$states, first:$first, orderBy: { field: UPDATED_AT, direction: DESC }) {
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
        }
      }
    }
  `;

  const variables = { owner, name, states, first };

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

  const nodes = json.data.repository.pullRequests.nodes;
  return nodes.map((n: any) => ({
    number: n.number,
    title: n.title,
    state: n.state,
    url: n.url,
    author: n.author?.login,
    mergedAt: n.mergedAt,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt
  }));
}
