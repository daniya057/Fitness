const { spawn } = require("child_process");
const net = require("net");
const { LINKS } = require("../server/env");

function listening(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function run(command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, CI: "1" },
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exit(code);
    }
  });
  return child;
}

async function main() {
  const apiPort = Number(LINKS.apiPort);
  const webPort = Number(LINKS.webPort);
  const apiUp = await listening(apiPort);
  const webUp = await listening(webPort);

  if (apiUp && webUp) {
    console.log("Уже запущено.");
    console.log(`Сайт: http://localhost:${webPort}`);
    console.log(`API:  http://localhost:${apiPort}`);
    return;
  }

  if (apiUp) {
    console.log(`API уже на http://localhost:${apiPort}`);
  } else {
    run("node", ["server/auth-server.js"]);
  }

  if (webUp) {
    console.log(`Сайт уже на http://localhost:${webPort}`);
  } else {
    run("npx", ["expo", "start", "--web", "--host", "lan", "--port", String(webPort)]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
