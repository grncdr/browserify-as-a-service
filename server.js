/**
 * This server is just a demo, discussion of the API to be exposed can be found
 * here: https://github.com/grncdr/browserify-as-a-service/issues/3
 */
var http = require('http');
var bundleFactory  = require('browserify-bundle-factory');

var getBundle = bundleFactory({
  cache: __dirname + '/package-cache',
  bundleDir: __dirname + '/public/bundles'
});

http.createServer(handleRequest).listen(process.env.PORT || 8888);

function handleRequest(req, res) {
  // just going to go on the internet and tell lies
  console.log(req.method, req.url);
  res.setHeader('Content-Type', 'application/json');
  function fail(code, message) {
    res.writeHead(code, message || http.STATUS_CODES[code]);
    res.end(JSON.stringify({message: message}));
  }
  switch (req.method) {
  case 'POST':
    if (req.url != '/browserify') {
      fail(404);
    } else {
      sendBundle(req, res);
    }
    break;
  case 'GET':
    fail(404)
    // TODO static file serving, especially cached bundles
    break;
  default:
    fail(405);
  }
}

function sendBundle(req, res) {
  var raw = "";
  console.log('reading body')
  req
  .on('data', function (chunk) { raw += chunk; })
  .on('end', function () {
    var body;
    try { body = JSON.parse(raw) } catch (err) {
      res.writeHead(422);
      res.end();
      return;
    }
    console.log('getting bundle', body);
    getBundle(body['package.json'], body.sources, body.browserify)
    .once('pathname', function (pathname) {
      pathname = pathname.replace(__dirname + '/public', '')
      console.log('got pathname', pathname);
      res.setHeader('Location', pathname);
      res.writeHead(201);
      res.setHeader('Content-Type', 'application/javascript');
    })
    .once('error', function (err) {
      console.log('bundle errored');
      res.writeHead(500);
      res.end(err.stack);
    })
    .pipe(res)
  })
  .setEncoding('utf-8')
}
