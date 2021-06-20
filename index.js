'use strict';

var Stream = require('stream');
var Path = require('path');

// Gulp 插件实质上是 Node 转换流（Transform Streams）
function gulpRename(obj, options) {
  options = options || {};

  var stream = new Stream.Transform({ objectMode: true }); // 创建一个转换流
  function parsePath(path) {
    // path = "src/actions/index.min.js"
    // multiExt: true, extname 是 min.js
    // multiExt: false, extname 是 .js
    var extname = options.multiExt
      ? Path.basename(path).slice(Path.basename(path).indexOf('.'))
      : Path.extname(path);
    return {
      dirname: Path.dirname(path),
      basename: Path.basename(path, extname), // @param extname — optionally, an extension to remove from the result. 如果传了 extname，会从结果中去掉 extname
      extname: extname
    };
  }

  stream._transform = function(originalFile, unused, callback) {
    // originalFile 是一个 Vinyl 实例
    // console.log('originalFile instanceof Vinyl', originalFile instanceof Vinyl) // true
    var file = originalFile.clone({ contents: false });
    var parsedPath = parsePath(file.relative);
    var path;

    var type = typeof obj;

    if (type === 'string' && obj !== '') {
      path = obj;
    } else if (type === 'function') {
      let newParsedPath = obj(parsedPath, file);
      if (typeof newParsedPath === 'object' && newParsedPath !== null) {
        parsedPath = newParsedPath;
      }

      path = Path.join(
        parsedPath.dirname,
        parsedPath.basename + parsedPath.extname
      );
    } else if (type === 'object' && obj !== undefined && obj !== null) {
      var dirname = 'dirname' in obj ? obj.dirname : parsedPath.dirname,
        prefix = obj.prefix || '',
        suffix = obj.suffix || '',
        basename = 'basename' in obj ? obj.basename : parsedPath.basename,
        extname = 'extname' in obj ? obj.extname : parsedPath.extname;

      path = Path.join(dirname, prefix + basename + suffix + extname); // prefix suffix 是 basename 的前缀和后缀
    } else {
      callback(
        new Error('Unsupported renaming parameter type supplied'),
        undefined
      );
      return;
    }

    file.path = Path.join(file.base, path);

    // Rename sourcemap if present
    if (file.sourceMap) {
      file.sourceMap.file = file.relative;
    }

    callback(null, file);
  };

  // gulp.pipe(rename()) pipe 的参数是一个 Stream
  return stream; // gulp 的返回值是一个 Stream
}

module.exports = gulpRename;
