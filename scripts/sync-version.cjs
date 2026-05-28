const fs = require("fs");
const path = require("path");

const version = process.argv[2];
if (!version) {
  console.error("Usage: node sync-version.cjs <version>");
  process.exit(1);
}

for (const rel of ["package.json", "client/package.json", "server/package.json"]) {
  const file = path.join(__dirname, "..", rel);
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  pkg.version = version;
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}
