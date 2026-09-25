const http = require("http");
const { LINKS } = require("../server/env");

const GATEWAY_PORT = Number(process.env.SHARE_PORT) || LINKS.sharePort || 8790;
const WEB_PORT = LINKS.webPort;
const API_PORT = LINKS.apiPort;

function targetFor(url) {
  const raw = url || "/";
  if (raw === "/api" || raw.startsWith("/api/") || raw.startsWith("/api?")) {
    let rest = raw.slice(4);
    if (!rest || rest.startsWith("?")) {
      rest = `/${rest}`;
    }
    return { port: API_PORT, path: rest };
  }
  return { port: WEB_PORT, path: raw };
}

function proxyRequest(req, res) {
  const { port, path } = targetFor(req.url);
  const headers = { ...req.headers, host: `127.0.0.1:${port}` };
  const upstream = http.request(
    {
      hostname: "127.0.0.1",
      port,
      path,
      method: req.method,
      headers,
    },
    (incoming) => {
      res.writeHead(incoming.statusCode || 502, incoming.headers);
      incoming.pipe(res);
    }
  );
  upstream.on("error", () => {
    if (res.headersSent) {
      res.end();
      return;
    }
    const json = JSON.stringify({
      error: "Сайт или API не запущены. Сначала npm run dev.",
    });
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(json);
  });
  req.pipe(upstream);
}

function proxyUpgrade(req, socket, head) {
  const { port, path } = targetFor(req.url);
  const upstream = http.request({
    hostname: "127.0.0.1",
    port,
    path,
    method: "GET",
    headers: { ...req.headers, host: `127.0.0.1:${port}` },
  });
  upstream.on("upgrade", (incoming, upstreamSocket, upstreamHead) => {
    const lines = ["HTTP/1.1 101 Switching Protocols"];
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) {
        value.forEach((item) => lines.push(`${key}: ${item}`));
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
    socket.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (upstreamHead?.length) {
      socket.write(upstreamHead);
    }
    if (head?.length) {
      upstreamSocket.write(head);
    }
    upstreamSocket.pipe(socket);
    socket.pipe(upstreamSocket);
  });
  upstream.on("error", () => socket.destroy());
  upstream.end();
}

function startGateway() {
  const server = http.createServer(proxyRequest);
  server.on("upgrade", proxyUpgrade);
  server.listen(GATEWAY_PORT, "127.0.0.1", () => {
    console.log(`Шлюз: http://127.0.0.1:${GATEWAY_PORT} → сайт ${WEB_PORT}, API ${API_PORT}`);
  });
  return server;
}

module.exports = { GATEWAY_PORT, startGateway };

if (require.main === module) {
  startGateway();
}
