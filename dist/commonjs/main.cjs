'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var logger = require('@jsenv/logger');
var importMap = require('@jsenv/import-map');
var util = require('@jsenv/util');

const NATIVE_NODE_MODULE_SPECIFIER_ARRAY = ["assert", "async_hooks", "buffer_ieee754", "buffer", "child_process", "cluster", "console", "constants", "crypto", "_debugger", "dgram", "dns", "domain", "events", "freelist", "fs", "fs/promises", "_http_agent", "_http_client", "_http_common", "_http_incoming", "_http_outgoing", "_http_server", "http", "http2", "https", "inspector", "_linklist", "module", "net", "node-inspect/lib/_inspect", "node-inspect/lib/internal/inspect_client", "node-inspect/lib/internal/inspect_repl", "os", "path", "perf_hooks", "process", "punycode", "querystring", "readline", "repl", "smalloc", "_stream_duplex", "_stream_transform", "_stream_wrap", "_stream_passthrough", "_stream_readable", "_stream_writable", "stream", "string_decoder", "sys", "timers", "_tls_common", "_tls_legacy", "_tls_wrap", "tls", "trace_events", "tty", "url", "util", "v8/tools/arguments", "v8/tools/codemap", "v8/tools/consarray", "v8/tools/csvparser", "v8/tools/logreader", "v8/tools/profile_view", "v8/tools/splaytree", "v8", "vm", "worker_threads", "zlib", // global is special
"global"];
const isNativeNodeModuleBareSpecifier = specifier => NATIVE_NODE_MODULE_SPECIFIER_ARRAY.includes(specifier);

const isNativeBrowserModuleBareSpecifier = () => false;

// https://github.com/benmosher/eslint-plugin-import/blob/master/resolvers/node/index.js

const applyUrlResolution = (specifier, importer) => {
  const url = util.resolveUrl(specifier, importer);
  return util.ensureWindowsDriveLetter(url, importer);
};

const interfaceVersion = 2;
const resolve = (source, file, {
  logLevel,
  projectDirectoryUrl,
  importMapFileRelativeUrl = "./import-map.importmap",
  caseSensitive = true,
  ignoreOutside = false,
  defaultExtension = false,
  node = false,
  browser = false
}) => {
  projectDirectoryUrl = util.assertAndNormalizeDirectoryUrl(projectDirectoryUrl);
  let importMap$1;

  if (typeof importMapFileRelativeUrl === "undefined") {
    importMap$1 = undefined;
  } else if (typeof importMapFileRelativeUrl === "string") {
    const importMapFileUrl = applyUrlResolution(importMapFileRelativeUrl, projectDirectoryUrl);

    if (ignoreOutside && !util.urlIsInsideOf(importMapFileUrl, projectDirectoryUrl)) {
      logger$1.warn(`import map file is outside project.
--- import map file ---
${util.urlToFileSystemPath(importMapFileUrl)}
--- project directory ---
${util.urlToFileSystemPath(projectDirectoryUrl)}`);
    }

    try {
      const importMapFilePath = util.urlToFileSystemPath(importMapFileUrl);
      const importMapFileBuffer = fs.readFileSync(importMapFilePath);
      const importMapFileString = String(importMapFileBuffer);
      importMap$1 = JSON.parse(importMapFileString);
      importMap$1 = importMap.normalizeImportMap(importMap$1, projectDirectoryUrl);
    } catch (e) {
      if (e && e.code === "ENOENT") {
        importMap$1 = {};
      } else {
        throw e;
      }
    }
  } else {
    throw new TypeError(`importMapFileRelativeUrl must be a string, got ${importMapFileRelativeUrl}`);
  }

  const logger$1 = logger.createLogger({
    logLevel
  });
  logger$1.debug(`
resolve import for project.
--- specifier ---
${source}
--- importer ---
${file}
--- project directory path ---
${util.urlToFileSystemPath(projectDirectoryUrl)}`);

  if (node && isNativeNodeModuleBareSpecifier(source)) {
    logger$1.debug(`-> native node module`);
    return {
      found: true,
      path: null
    };
  }

  if (browser && isNativeBrowserModuleBareSpecifier()) {
    logger$1.debug(`-> native browser module`);
    return {
      found: true,
      path: null
    };
  }

  const specifier = source;
  const importer = String(util.fileSystemPathToUrl(file));

  try {
    let importUrl;

    try {
      importUrl = importMap.resolveImport({
        specifier,
        importer,
        importMap: importMap$1,
        defaultExtension
      });
    } catch (e) {
      if (e.message.includes("bare specifier")) {
        // this is an expected error and the file cannot be found
        logger$1.debug("unmapped bare specifier");
        return {
          found: false,
          path: null
        };
      } // this is an unexpected error


      throw e;
    }

    importUrl = util.ensureWindowsDriveLetter(importUrl, importer);

    if (importUrl.startsWith("file://")) {
      const importFilePath = util.urlToFileSystemPath(importUrl);

      if (ignoreOutside && !util.urlIsInsideOf(importUrl, projectDirectoryUrl)) {
        logger$1.warn(`ignoring import outside project
--- import file ---
${importFilePath}
--- project directory ---
${util.urlToFileSystemPath(projectDirectoryUrl)}
`);
        return {
          found: false,
          path: importFilePath
        };
      }

      if (pathLeadsToFile(importFilePath)) {
        if (caseSensitive) {
          const importFileRealPath = fs.realpathSync.native(importFilePath);

          if (importFileRealPath !== importFilePath) {
            logger$1.warn(`WARNING: file found at ${importFilePath} but would not be found on a case sensitive filesystem.
The real file path is ${importFileRealPath}.
You can choose to disable this warning by disabling case sensitivity.
If you do so keep in mind windows users would not find that file.`);
            return {
              found: false,
              path: importFilePath
            };
          }
        }

        logger$1.debug(`-> found file at ${importUrl}`);
        return {
          found: true,
          path: importFilePath
        };
      }

      logger$1.debug(`-> file not found at ${importUrl}`);
      return {
        found: false,
        path: importFilePath
      };
    }

    if (importUrl.startsWith("https://") || importUrl.startsWith("http://")) {
      // this api is synchronous we cannot check
      // if a remote http/https file is available
      logger$1.debug(`-> consider found because of http(s) scheme ${importUrl}`);
      return {
        found: true,
        path: null
      };
    }

    logger$1.debug(`-> consider not found because of scheme ${importUrl}`);
    return {
      found: false,
      path: null
    };
  } catch (e) {
    logger$1.error(e.stack);
    return {
      found: false,
      path: null
    };
  }
};

const pathLeadsToFile = path => {
  try {
    const stats = fs.statSync(path);
    return stats.isFile();
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return false;
    }

    throw e;
  }
};

exports.interfaceVersion = interfaceVersion;
exports.resolve = resolve;

//# sourceMappingURL=main.cjs.map