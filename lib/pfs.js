/**
 * Wrap built-in fs in promises, somebody probably already did this, but I
 * can't be bothered to google it atm
 */
var Q  = require('q');
var fs = require('fs');

for (var name in fs) {
  if (name === 'exists') {
    continue
  } else if (name.match(/Sync$|Stream$/)) {
    exports[name] = fs[name];
  } else {
    exports[name] = Q.nfbind(fs[name]);
  }
}

exports.exists = function (path) {
  var d = Q.defer()
  fs.exists(path, d.resolve);
  return d.promise;
};
