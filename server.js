/**
 * This server is just a demo, discussion of the API to be exposed can be found
 * here: https://github.com/grncdr/browserify-as-a-service/issues/3
 */
var http          = require('http');
var bundleFactory = require('browserify-bundle-factory');
var ecstatic      = require('ecstatic');

var getBundle = bundleFactory({
  cache: __dirname + '/package-cache',
  bundleDir: __dirname + '/public/bundles'
});

var serveStatic = ecstatic({
  root:     __dirname + '/public',
  showDir: true,
  gzip:    true
});

http.createServer(handleRequest).listen(process.env.PORT || 8888);

function handleRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  function fail(code, message) {
    res.writeHead(code, message || http.STATUS_CODES[code]);
    res.end(JSON.stringify({message: message}));
  }

  serveStatic(req, res, function (err) {
    if (err) {
      res.write(err.stack);
      return fail(500);
    }

    switch (req.method) {
    case 'POST':
      if (req.url != '/browserify') {
        fail(404);
      } else {
        sendBundle(req, res);
      }
      break;
    default:
      fail(405);
    }
  })
}

function sendBundle(req, res) {
  var raw = "";
  req
  .on('data', function (chunk) { raw += chunk; })
  .on('end', function () {
    var body;
    try { body = JSON.parse(raw) } catch (err) {
      res.writeHead(422);
      res.end();
      return;
    }
    getBundle(body['package.json'], body.sources, body.browserify)
    .once('pathname', function (pathname) {
      pathname = pathname.replace(__dirname + '/public', '')
      res.setHeader('Location', pathname);
      res.writeHead(201);
      res.setHeader('Content-Type', 'application/javascript');
    })
    .once('error', function (err) {
      res.writeHead(500);
      res.end(err.stack);
    })
    .pipe(res)
  })
  .setEncoding('utf-8')
}
