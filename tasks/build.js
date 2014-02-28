/*!
 * @author donaldyang
 */

!function () {
  'use strict';
  var fs = require('fs')
    , path = require('path')
    , getDeps = require('./tool/getDeps')
    , outs = {};

  function build(into, cb) {
    if (outs[into]) return cb('');
    outs[into] = true;
    var l, stack = [];
    fs.readFile(into, { encoding: 'utf-8' }, function (err, data) {
      if (err) throw err;
      var deps = getDeps(data), tmp = [];
      deps.forEach(function (dep, i) {
        tmp.push("'" + dep + "'");
      });
      data = [
        "define('./",
        path.basename(into, '.js'),
        "', ",
        deps.length ? "[" + tmp.join(', ') + "], " : "",
        "function (require, exports, module) {\n",
        data,
        '\n});'
      ].join('');
      stack.unshift(data);
      l = deps.length;
      if (l) {
        deps.forEach(function (dep) {
          build(findIn(into, dep), function (data) {
            stack.unshift(data);
            if (!--l) {
              cb(stack.join('\n'));
            }
          });
        });
      } else {
        cb(stack[0]);
      }
    });
  }

  function findIn(into, dep) {
    into = into.replace(/[^\/\\]*\.js$/, '');
    return path.join(into, dep) + '.js';
  }

  module.exports = function (grunt) {
    grunt.registerMultiTask('dwarfBuild', 'dwarf module build', function () {
      var done = this.async(), l = 0;
      this.files.forEach(function (f) {
        f.src.filter(function (filepath) {
          var exists = grunt.file.exists(filepath);
          if (!exists) {
            grunt.log.warn('File "' + filepath + '" not found.');
          }
          return exists;
        })
        .forEach(function (filepath) {
          l++;
          build(filepath, function (data) {
            data = [
              '/*!',
              ' * Build by grunt-dwarf-builder',
              ' * All code belongs to the original author',
              ' */'
            ].join('\n') + data;
            grunt.file.write(f.dest, data);
            grunt.log.writeln('File "' + f.dest + '" created.');
            if (!--l) {
              done();
            }
          });
        });
      });
    });
  }
}();