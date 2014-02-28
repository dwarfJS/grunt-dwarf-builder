!function () {
  'use strict';

  function getDeps(string) {
    var deps = []
      , got = {};
    string.replace(/(^|[^\.\/\w])require\s*\(\s*(["'])([^"']+?)\2\s*\)/mg, function (full, lead, quote, dep) {
      got[dep] || deps.push(dep);
      got[dep] = true;
      return full;
    });
    return deps;
  }

  module.exports = getDeps;
}();