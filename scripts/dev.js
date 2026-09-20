const { spawn } = require("child_process");
const { LINKS } = require("../server/env");

function run(command, args) {
  const child = spawn(command, args, { stdio: "inherit", shell: true, env: { ...process.env, CI: "1" } });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exit(code);
    }
  });
  return child;
}

run("node", ["server/auth-server.js"]);
run("npx", ["expo", "start", "--web", `--port`, String(LINKS.webPort)]);
