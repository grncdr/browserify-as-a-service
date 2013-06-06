/**
 * Exports the worker function that makes a bundle from a package.json and
 * source file * (as strings).
 */
var crypto = require('crypto');
var bify   = require('browserify')
var mkdirp = require('mkdirp');
var Q      = require('q');
var rimraf = require('rimraf');
var fs     = require('./pfs');
var exec   = Q.nfbind(require('child_process').exec);

module.exports = function (opts) {
  opts.workDir = opts.workDir || (__dirname + '/../tmp');

  return function (pkg_json, code) {
    var hash = crypto.createHash('sha1');
    hash.update(pkg_json);
    hash.update(code);
    var digest = hash.digest('hex')
    var dir = [opts.workDir]
      .concat(digest.substring(0, 6).match(/../g))
      .concat([digest.substring(6)])
      .join('/');

    console.log("package dir: %s", dir);
    return Q.all([
      fs.exists(dir),
      fs.exists(dir + '/bundle.js')
    ]).spread(function (dirExists, bundleExists) {
      console.log("bundleExists: %j, dirExists: %j", bundleExists, dirExists);

      if (bundleExists) {
        console.log('bundleExists');
        return fs.createReadStream(dir + '/bundle.js');
      }

      return (dirExists ? Q.nfcall(rimraf, dir) : Q())
        .then(makePackageDir)
        .then(writePackageFiles)
        .then(npmInstall)
        .then(buildBundle);
    });

    function makePackageDir() {
      console.log('makePackageDir')
      return Q.nfcall(mkdirp, dir)
    }

    function writePackageFiles() {
      console.log('writePackageFiles')
      return Q.all([
        fs.writeFile(dir + '/package.json', pkg_json),
        fs.writeFile(dir + '/index.js', code)
      ]);
    }

    function npmInstall() {
      console.log('npmInstall');
      return Q.nfcall(exec, 'npm install', {cwd: dir});
    }

    function buildBundle() {
      console.log('buildBundle');
      var b = bify();
      b.add(dir + '/index.js');
      return b.bundle();
    }
  }
};
