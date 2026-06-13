import { NextResponse } from "next/server";

export const revalidate = 3600;

const GITHUB_USER = "eduardoemanuelcf";
const HEADERS = { "User-Agent": "portfolio-app" };

const fallbackEvents = [
  {
    id: "mock-1",
    type: "PushEvent",
    repo: { name: "eduardoemanuelcf/tick-panic" },
    payload: {
      ref: "refs/heads/main",
      commits: [
        { message: "feat: implement clean architecture use-cases with full TDD coverage" },
      ],
    },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "mock-2",
    type: "PushEvent",
    repo: { name: "eduardoemanuelcf/job-log" },
    payload: {
      ref: "refs/heads/main",
      commits: [
        { message: "refactor: optimize hybrid extraction logic using Gemini 1.5 Flash" },
      ],
    },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export async function GET() {
  try {
    const eventsRes = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`,
      { headers: HEADERS }
    );

    if (!eventsRes.ok) {
      throw new Error(`GitHub API returned status ${eventsRes.status}`);
    }

    const events = await eventsRes.json();
    const repos: string[] = [];
    for (const event of events) {
      if (event.type === "PushEvent" && !repos.includes(event.repo.name)) {
        repos.push(event.repo.name);
      }
      if (repos.length >= 4) break;
    }
    if (repos.length === 0) {
      repos.push(`${GITHUB_USER}/portfolio`);
    }

    const groups = await Promise.all(
      repos.map(async (name) => {
        const res = await fetch(
          `https://api.github.com/repos/${name}/commits?per_page=3`,
          { headers: HEADERS }
        );
        if (!res.ok) return [];
        const commits = await res.json();
        return commits.map((commit: { sha: string; commit: { message: string; author: { date: string } } }) => ({
          id: commit.sha,
          type: "PushEvent",
          repo: { name },
          payload: {
            ref: "refs/heads/main",
            commits: [{ message: commit.commit.message.split("\n")[0] }],
          },
          created_at: commit.commit.author.date,
        }));
      })
    );

    const merged = groups
      .flat()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(merged);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching GitHub activity:", message);
    return NextResponse.json(fallbackEvents);
  }
}
