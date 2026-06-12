import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const publicRouteDir = join(distDir, "public");

await copyFile(join(distDir, "index.html"), join(distDir, "404.html"));
await mkdir(publicRouteDir, { recursive: true });
await copyFile(join(distDir, "index.html"), join(publicRouteDir, "index.html"));
