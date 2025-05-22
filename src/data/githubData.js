// src/data/githubData.js
import axios from 'axios';

const REPO = 'c-h-david/rapid';
const BASE_URL = `https://api.github.com/repos/${REPO}`;
const HEADERS = {
  Accept: 'application/vnd.github+json',
  // Authorization: `Bearer YOUR_GITHUB_TOKEN` // Optional: If hitting rate limits
};

async function getGithubData() {
  const [repo, contributors, releases, commits] = await Promise.all([
    axios.get(BASE_URL, { headers: HEADERS }),
    axios.get(`${BASE_URL}/contributors?per_page=100`, { headers: HEADERS }),
    axios.get(`${BASE_URL}/releases`, { headers: HEADERS }),
    axios.get(`${BASE_URL}/commits?per_page=1`, { headers: HEADERS })
  ]);

  // Extract commit count from "Link" header
  let commitCount = 0;
  const linkHeader = commits.headers.link;
  if (linkHeader && /rel="last"/.test(linkHeader)) {
    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
    if (match) {
      commitCount = parseInt(match[1], 10);
    }
  } else {
    // Fallback if Link header is missing (e.g., very few commits)
    commitCount = commits.data.length;
  }

  const githubData = [
    { metric: 'Stars', value: repo.data.stargazers_count },
    { metric: 'Forks', value: repo.data.forks_count },
    { metric: 'Contributors', value: contributors.data.length },
    { metric: 'Open Issues', value: repo.data.open_issues_count },
    { metric: 'Releases', value: releases.data.length },
    { metric: 'Commits', value: commitCount }
  ];

  return githubData;
}

export default await getGithubData();
