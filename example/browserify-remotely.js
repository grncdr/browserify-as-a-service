var fs   = require('fs');
var http = require('http');

var pkgJSON = require('./package.json');
var indexJS = fs.readFileSync(__dirname + '/index.js').toString();

var req = http.request({
  method: 'POST',
  path: '/browserify',
  host: 'localhost',
  port: process.env.PORT || 8888,
  headers: { 'Content-Type': 'application/json' }
})

req.end(JSON.stringify({
  'package.json': pkgJSON,
  sources: {
    './index.js': {
      source: indexJS,
      entry: true
    }
  },
  browserify: {}
}))

req.on('response', function (res) {
  res.pipe(process.stdout);
})
