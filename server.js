var http    = require('http');
var Q       = require('q');
var express = require('express');
var bundle  = require('./lib/bundler')({workDir: __dirname + '/tmp'});
var fs      = require('./lib/pfs');
var engines = require('consolidate');

var app = express();

app.use(express.bodyParser())
app.set('view engine', 'eco')
app.engine('eco', engines.eco)

app.get('/', function (req, res) {
  res.render('index');
})

app.post('/browserify', function (req, res) {
  var files = req.files;
  if (!(files && files.package_json && files.source)) {
    return res.end({error: "package_json and source are required"})
  }
  // TODO - more validation

  var reads = [
    fs.readFile(files.package_json.path),
    fs.readFile(files.source.path)
  ]

  Q.all(reads).spread(bundle).spread(
    function (b, dir) {
      //res.setHeader('Location', '/bundle/' + dir)
      b.pipe(res)
    },
    function (err) {
      console.log(err);
      console.log(err.stack);
      res.end("" + err.stack);
    }
  )
})

http.createServer(app).listen(process.env.PORT || 8888);
