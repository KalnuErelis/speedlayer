import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(repoRoot, 'docs', 'speedlayer');
const port = Number.parseInt(process.env.PORT ?? '8765', 10);
const host = process.env.HOST ?? '127.0.0.1';

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mp4', 'video/mp4'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function resolveRequestPath(url) {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  } catch {
    return { status: 400 };
  }

  const fixturePrefix = '/docs/speedlayer/';
  const requestedPath = pathname === '/'
    ? '/manual-test.html'
    : pathname.startsWith(fixturePrefix)
      ? pathname.slice(fixturePrefix.length - 1)
      : pathname;
  const absolutePath = path.resolve(fixtureRoot, `.${requestedPath}`);

  if (!absolutePath.startsWith(`${fixtureRoot}${path.sep}`) && absolutePath !== fixtureRoot) {
    return { status: 403 };
  }

  return { absolutePath };
}

const server = createServer(async (request, response) => {
  const resolved = resolveRequestPath(request.url ?? '/');

  if (!resolved.absolutePath) {
    response.writeHead(resolved.status ?? 404);
    response.end(resolved.status === 400 ? 'Bad request' : 'Forbidden');
    return;
  }

  try {
    const { absolutePath } = resolved;
    const fileStat = await stat(absolutePath);

    if (!fileStat.isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Length': fileStat.size,
      'Content-Type': contentTypes.get(path.extname(absolutePath)) ?? 'application/octet-stream',
    });
    createReadStream(absolutePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`SpeedLayer manual test: http://${host}:${port}/docs/speedlayer/manual-test.html`);
});
