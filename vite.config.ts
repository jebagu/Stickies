import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin, ViteDevServer, PreviewServer } from "vite";

const execFileAsync = promisify(execFile);
const publishedDir = join(process.cwd(), "public", "published");
const maxPublishAttempts = 5;

type PublishRequest = {
  project?: {
    snapshots?: unknown[];
    updatedAt?: string;
    [key: string]: unknown;
  };
};

function createPublishSlug() {
  return randomBytes(6).toString("base64url").toLowerCase();
}

function getPublicUrl(slug: string) {
  return `https://jebagu.github.io/Stickies/public/${slug}/`;
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as PublishRequest;
}

async function runGit(args: string[]) {
  const { stderr } = await execFileAsync("git", args, {
    cwd: process.cwd(),
  });

  if (stderr.trim()) {
    return stderr.trim();
  }

  return "";
}

async function createPublishedSnapshot(project: NonNullable<PublishRequest["project"]>) {
  await mkdir(publishedDir, { recursive: true });

  for (let attempt = 0; attempt < maxPublishAttempts; attempt += 1) {
    const slug = createPublishSlug();
    const repoPath = `public/published/${slug}.json`;
    const absolutePath = join(process.cwd(), repoPath);

    if (existsSync(absolutePath)) {
      continue;
    }

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(
      absolutePath,
      `${JSON.stringify(
        {
          ...project,
          snapshots: [],
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    await runGit(["add", repoPath]);
    await runGit(["commit", "-m", `Publish snapshot ${slug}`, "--", repoPath]);
    await runGit(["push", "origin", "main"]);

    return {
      slug,
      publicUrl: getPublicUrl(slug),
    };
  }

  throw new Error("Could not create a unique published snapshot slug.");
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

function stickiesPublishPlugin(): Plugin {
  function configure(server: ViteDevServer | PreviewServer) {
    server.middlewares.use(async (request, response, next) => {
      const requestUrl = request.url?.split("?")[0] ?? "";

      if (request.method !== "POST" || !requestUrl.endsWith("/__stickies_publish")) {
        next();
        return;
      }

      try {
        const body = await readJsonBody(request);

        if (!body.project || typeof body.project !== "object") {
          sendJson(response, 400, {
            ok: false,
            error: "Publish request did not include a project snapshot.",
          });
          return;
        }

        const result = await createPublishedSnapshot(body.project);
        sendJson(response, 200, {
          ok: true,
          ...result,
        });
      } catch (error) {
        sendJson(response, 500, {
          ok: false,
          error: error instanceof Error ? error.message : "Publish failed.",
        });
      }
    });
  }

  return {
    name: "stickies-local-publish",
    configureServer: configure,
    configurePreviewServer: configure,
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stickiesPublishPlugin()],
  base: process.env.VITE_BASE_PATH ?? "/Stickies/",
  server: {
    host: "127.0.0.1",
    port: 5178,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4178,
    strictPort: true,
  },
});
