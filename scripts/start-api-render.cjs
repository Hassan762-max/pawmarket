const { spawnSync } = require("child_process");
const path = require("path");

function looksLikePostgres(url) {
  return typeof url === "string" && /^postgres(ql)?:\/\//i.test(url.trim());
}

function fromParts() {
  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.POSTGRES_DATABASE;
  const port = process.env.PGPORT || process.env.POSTGRES_PORT || "5432";
  if (!host || !user || !password || !database) return null;
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

let url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_CONNECTION_STRING ||
  fromParts();

if (!looksLikePostgres(url)) {
  console.error(`
[pawmarket] DATABASE_URL is missing or invalid for Prisma.
It must look like: postgresql://USER:PASSWORD@HOST:5432/DATABASE

On Render:
  1. Dashboard → New → PostgreSQL (or open your existing DB).
  2. Open pawmarket-api → Environment.
  3. Add variable DATABASE_URL:
     - Use "Add from Database" / Connect and select your Postgres, OR
     - Copy Internal Database URL from the Postgres service and paste it.
  4. Save Changes → Manual Deploy → Deploy latest commit.
`);
  process.exit(1);
}

process.env.DATABASE_URL = url.trim();
console.log("[pawmarket] DATABASE_URL OK");

const root = path.join(__dirname, "..");
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status || 1);
};

run("npm", ["run", "prisma:generate", "-w", "@pawmarket/api"]);
run("npx", ["prisma", "db", "push"], path.join(root, "apps", "api"));
run("node", ["dist/main.js"], path.join(root, "apps", "api"));
