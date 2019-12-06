'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');
var url = require('url');

const LOG_LEVEL_OFF = "off";
const LOG_LEVEL_DEBUG = "debug";
const LOG_LEVEL_INFO = "info";
const LOG_LEVEL_WARN = "warn";
const LOG_LEVEL_ERROR = "error";

const createLogger = ({
  logLevel = LOG_LEVEL_INFO
} = {}) => {
  if (logLevel === LOG_LEVEL_DEBUG) {
    return {
      debug,
      info,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_INFO) {
    return {
      debug: debugDisabled,
      info,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_WARN) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_ERROR) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn: warnDisabled,
      error
    };
  }

  if (logLevel === LOG_LEVEL_OFF) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn: warnDisabled,
      error: errorDisabled
    };
  }

  throw new Error(createUnexpectedLogLevelMessage({
    logLevel
  }));
};

const createUnexpectedLogLevelMessage = ({
  logLevel
}) => `unexpected logLevel.
--- logLevel ---
${logLevel}
--- allowed log levels ---
${LOG_LEVEL_OFF}
${LOG_LEVEL_ERROR}
${LOG_LEVEL_WARN}
${LOG_LEVEL_INFO}
${LOG_LEVEL_DEBUG}
`;

const debug = console.debug;

const debugDisabled = () => {};

const info = console.info;

const infoDisabled = () => {};

const warn = console.warn;

const warnDisabled = () => {};

const error = console.error;

const errorDisabled = () => {};

const assertImportMap = value => {
  if (value === null) {
    throw new TypeError(`an importMap must be an object, got null`);
  }

  const type = typeof value;

  if (type !== "object") {
    throw new TypeError(`an importMap must be an object, received ${value}`);
  }

  if (Array.isArray(value)) {
    throw new TypeError(`an importMap must be an object, received array ${value}`);
  }
};

const hasScheme = string => {
  return /^[a-zA-Z]{2,}:/.test(string);
};

const urlToScheme = urlString => {
  const colonIndex = urlString.indexOf(":");
  if (colonIndex === -1) return "";
  return urlString.slice(0, colonIndex);
};

const urlToPathname = urlString => {
  return ressourceToPathname(urlToRessource(urlString));
};

const urlToRessource = urlString => {
  const scheme = urlToScheme(urlString);

  if (scheme === "file") {
    return urlString.slice("file://".length);
  }

  if (scheme === "https" || scheme === "http") {
    // remove origin
    const afterProtocol = urlString.slice(scheme.length + "://".length);
    const pathnameSlashIndex = afterProtocol.indexOf("/", "://".length);
    return afterProtocol.slice(pathnameSlashIndex);
  }

  return urlString.slice(scheme.length + 1);
};

const ressourceToPathname = ressource => {
  const searchSeparatorIndex = ressource.indexOf("?");
  return searchSeparatorIndex === -1 ? ressource : ressource.slice(0, searchSeparatorIndex);
};

const urlToOrigin = urlString => {
  const scheme = urlToScheme(urlString);

  if (scheme === "file") {
    return "file://";
  }

  if (scheme === "http" || scheme === "https") {
    const secondProtocolSlashIndex = scheme.length + "://".length;
    const pathnameSlashIndex = urlString.indexOf("/", secondProtocolSlashIndex);
    if (pathnameSlashIndex === -1) return urlString;
    return urlString.slice(0, pathnameSlashIndex);
  }

  return urlString.slice(0, scheme.length + 1);
};

const pathnameToDirectoryPathname = pathname => {
  const slashLastIndex = pathname.lastIndexOf("/");
  if (slashLastIndex === -1) return "";
  return pathname.slice(0, slashLastIndex);
};

// could be useful: https://url.spec.whatwg.org/#url-miscellaneous
const resolveUrl = (specifier, baseUrl) => {
  if (baseUrl) {
    if (typeof baseUrl !== "string") {
      throw new TypeError(writeBaseUrlMustBeAString({
        baseUrl,
        specifier
      }));
    }

    if (!hasScheme(baseUrl)) {
      throw new Error(writeBaseUrlMustBeAbsolute({
        baseUrl,
        specifier
      }));
    }
  }

  if (hasScheme(specifier)) {
    return specifier;
  }

  if (!baseUrl) {
    throw new Error(writeBaseUrlRequired({
      baseUrl,
      specifier
    }));
  } // scheme relative


  if (specifier.slice(0, 2) === "//") {
    return `${urlToScheme(baseUrl)}:${specifier}`;
  } // origin relative


  if (specifier[0] === "/") {
    return `${urlToOrigin(baseUrl)}${specifier}`;
  }

  const baseOrigin = urlToOrigin(baseUrl);
  const basePathname = urlToPathname(baseUrl);

  if (specifier === ".") {
    const baseDirectoryPathname = pathnameToDirectoryPathname(basePathname);
    return `${baseOrigin}${baseDirectoryPathname}/`;
  } // pathname relative inside


  if (specifier.slice(0, 2) === "./") {
    const baseDirectoryPathname = pathnameToDirectoryPathname(basePathname);
    return `${baseOrigin}${baseDirectoryPathname}/${specifier.slice(2)}`;
  } // pathname relative outside


  if (specifier.slice(0, 3) === "../") {
    let unresolvedPathname = specifier;
    const importerFolders = basePathname.split("/");
    importerFolders.pop();

    while (unresolvedPathname.slice(0, 3) === "../") {
      unresolvedPathname = unresolvedPathname.slice(3); // when there is no folder left to resolved
      // we just ignore '../'

      if (importerFolders.length) {
        importerFolders.pop();
      }
    }

    const resolvedPathname = `${importerFolders.join("/")}/${unresolvedPathname}`;
    return `${baseOrigin}${resolvedPathname}`;
  } // bare


  if (basePathname === "") {
    return `${baseOrigin}/${specifier}`;
  }

  if (basePathname[basePathname.length] === "/") {
    return `${baseOrigin}${basePathname}${specifier}`;
  }

  return `${baseOrigin}${pathnameToDirectoryPathname(basePathname)}/${specifier}`;
};

const writeBaseUrlMustBeAString = ({
  baseUrl,
  specifier
}) => `baseUrl must be a string.
--- base url ---
${baseUrl}
--- specifier ---
${specifier}`;

const writeBaseUrlMustBeAbsolute = ({
  baseUrl,
  specifier
}) => `baseUrl must be absolute.
--- base url ---
${baseUrl}
--- specifier ---
${specifier}`;

const writeBaseUrlRequired = ({
  baseUrl,
  specifier
}) => `baseUrl required to resolve relative specifier.
--- base url ---
${baseUrl}
--- specifier ---
${specifier}`;

const tryUrlResolution = (string, url) => {
  const result = resolveUrl(string, url);
  return hasScheme(result) ? result : null;
};

const resolveSpecifier = (specifier, importer) => {
  if (specifier[0] === "/" || specifier.startsWith("./") || specifier.startsWith("../")) {
    return resolveUrl(specifier, importer);
  }

  if (hasScheme(specifier)) {
    return specifier;
  }

  return null;
};

const applyImportMap = ({
  importMap,
  specifier,
  importer
}) => {
  assertImportMap(importMap);

  if (typeof specifier !== "string") {
    throw new TypeError(writeSpecifierMustBeAString({
      specifier,
      importer
    }));
  }

  if (importer) {
    if (typeof importer !== "string") {
      throw new TypeError(writeImporterMustBeAString({
        importer,
        specifier
      }));
    }

    if (!hasScheme(importer)) {
      throw new Error(writeImporterMustBeAbsolute({
        importer,
        specifier
      }));
    }
  }

  const specifierUrl = resolveSpecifier(specifier, importer);
  const specifierNormalized = specifierUrl || specifier;
  const {
    scopes
  } = importMap;

  if (scopes && importer) {
    const scopeKeyMatching = Object.keys(scopes).find(scopeKey => {
      return scopeKey === importer || specifierIsPrefixOf(scopeKey, importer);
    });

    if (scopeKeyMatching) {
      const scopeValue = scopes[scopeKeyMatching];
      const remappingFromScopeImports = applyImports(specifierNormalized, scopeValue);

      if (remappingFromScopeImports !== null) {
        return remappingFromScopeImports;
      }
    }
  }

  const {
    imports
  } = importMap;

  if (imports) {
    const remappingFromImports = applyImports(specifierNormalized, imports);

    if (remappingFromImports !== null) {
      return remappingFromImports;
    }
  }

  if (specifierUrl) {
    return specifierUrl;
  }

  throw new Error(writeBareSpecifierMustBeRemapped({
    specifier,
    importer
  }));
};

const applyImports = (specifier, imports) => {
  const importKeyArray = Object.keys(imports);
  let i = 0;

  while (i < importKeyArray.length) {
    const importKey = importKeyArray[i];
    i++;

    if (importKey === specifier) {
      const importValue = imports[importKey];
      return importValue;
    }

    if (specifierIsPrefixOf(importKey, specifier)) {
      const importValue = imports[importKey];
      const afterImportKey = specifier.slice(importKey.length);
      return tryUrlResolution(afterImportKey, importValue);
    }
  }

  return null;
};

const specifierIsPrefixOf = (specifierHref, href) => {
  return specifierHref[specifierHref.length - 1] === "/" && href.startsWith(specifierHref);
};

const writeSpecifierMustBeAString = ({
  specifier,
  importer
}) => `specifier must be a string.
--- specifier ---
${specifier}
--- importer ---
${importer}`;

const writeImporterMustBeAString = ({
  importer,
  specifier
}) => `importer must be a string.
--- importer ---
${importer}
--- specifier ---
${specifier}`;

const writeImporterMustBeAbsolute = ({
  importer,
  specifier
}) => `importer must be an absolute url.
--- importer ---
${importer}
--- specifier ---
${specifier}`;

const writeBareSpecifierMustBeRemapped = ({
  specifier,
  importer
}) => `Unmapped bare specifier.
--- specifier ---
${specifier}
--- importer ---
${importer}`;

const sortImports = imports => {
  const importsSorted = {};
  Object.keys(imports).sort(compareLengthOrLocaleCompare).forEach(name => {
    importsSorted[name] = imports[name];
  });
  return importsSorted;
};
const sortScopes = scopes => {
  const scopesSorted = {};
  Object.keys(scopes).sort(compareLengthOrLocaleCompare).forEach(scopeName => {
    scopesSorted[scopeName] = sortImports(scopes[scopeName]);
  });
  return scopesSorted;
};

const compareLengthOrLocaleCompare = (a, b) => {
  return b.length - a.length || a.localeCompare(b);
};

const normalizeImportMap = (importMap, baseUrl) => {
  assertImportMap(importMap);

  if (typeof baseUrl !== "string") {
    throw new TypeError(formulateBaseUrlMustBeAString({
      baseUrl
    }));
  }

  const {
    imports,
    scopes
  } = importMap;
  return {
    imports: imports ? normalizeImports(imports, baseUrl) : undefined,
    scopes: scopes ? normalizeScopes(scopes, baseUrl) : undefined
  };
};

const normalizeImports = (imports, baseUrl) => {
  const importsNormalized = {};
  Object.keys(imports).forEach(specifier => {
    const address = imports[specifier];

    if (typeof address !== "string") {
      console.warn(formulateAddressMustBeAString({
        address,
        specifier
      }));
      return;
    }

    const specifierResolved = resolveSpecifier(specifier, baseUrl) || specifier;
    const addressUrl = tryUrlResolution(address, baseUrl);

    if (addressUrl === null) {
      console.warn(formulateAdressResolutionFailed({
        address,
        baseUrl,
        specifier
      }));
      return;
    }

    if (specifier.endsWith("/") && !addressUrl.endsWith("/")) {
      console.warn(formulateAddressUrlRequiresTrailingSlash({
        addressUrl,
        address,
        specifier
      }));
      return;
    }

    importsNormalized[specifierResolved] = addressUrl;
  });
  return sortImports(importsNormalized);
};

const normalizeScopes = (scopes, baseUrl) => {
  const scopesNormalized = {};
  Object.keys(scopes).forEach(scope => {
    const scopeValue = scopes[scope];
    const scopeUrl = tryUrlResolution(scope, baseUrl);

    if (scopeUrl === null) {
      console.warn(formulateScopeResolutionFailed({
        scope,
        baseUrl
      }));
      return;
    }

    const scopeValueNormalized = normalizeImports(scopeValue, baseUrl);
    scopesNormalized[scopeUrl] = scopeValueNormalized;
  });
  return sortScopes(scopesNormalized);
};

const formulateBaseUrlMustBeAString = ({
  baseUrl
}) => `baseUrl must be a string.
--- base url ---
${baseUrl}`;

const formulateAddressMustBeAString = ({
  specifier,
  address
}) => `Address must be a string.
--- address ---
${address}
--- specifier ---
${specifier}`;

const formulateAdressResolutionFailed = ({
  address,
  baseUrl,
  specifier
}) => `Address url resolution failed.
--- address ---
${address}
--- base url ---
${baseUrl}
--- specifier ---
${specifier}`;

const formulateAddressUrlRequiresTrailingSlash = ({
  addressURL,
  address,
  specifier
}) => `Address must end with /.
--- address url ---
${addressURL}
--- address ---
${address}
--- specifier ---
${specifier}`;

const formulateScopeResolutionFailed = ({
  scope,
  baseUrl
}) => `Scope url resolution failed.
--- scope ---
${scope}
--- base url ---
${baseUrl}`;

const pathnameToExtension = pathname => {
  const slashLastIndex = pathname.lastIndexOf("/");

  if (slashLastIndex !== -1) {
    pathname = pathname.slice(slashLastIndex + 1);
  }

  const dotLastIndex = pathname.lastIndexOf(".");
  if (dotLastIndex === -1) return ""; // if (dotLastIndex === pathname.length - 1) return ""

  return pathname.slice(dotLastIndex);
};

const resolveImport = ({
  specifier,
  importer,
  importMap,
  defaultExtension = true
}) => {
  return applyDefaultExtension({
    url: importMap ? applyImportMap({
      importMap,
      specifier,
      importer
    }) : resolveUrl(specifier, importer),
    importer,
    defaultExtension
  });
};

const applyDefaultExtension = ({
  url,
  importer,
  defaultExtension
}) => {
  if (urlToPathname(url).endsWith("/")) {
    return url;
  }

  if (typeof defaultExtension === "string") {
    const extension = pathnameToExtension(url);

    if (extension === "") {
      return `${url}${defaultExtension}`;
    }

    return url;
  }

  if (defaultExtension === true) {
    const extension = pathnameToExtension(url);

    if (extension === "" && importer) {
      const importerPathname = urlToPathname(importer);
      const importerExtension = pathnameToExtension(importerPathname);
      return `${url}${importerExtension}`;
    }
  }

  return url;
};

const {
  platform
} = process;
const isWindows = platform === "win32";
const percentRegEx = /%/g;
const backslashRegEx = /\\/g;
const newlineRegEx = /\n/g;
const carriageReturnRegEx = /\r/g;
const tabRegEx = /\t/g;

const pathToFileURLPolyfill = filepath => {
  let resolved = path.resolve(filepath); // path.resolve strips trailing slashes so we must add them back

  const filePathLast = filepath.charCodeAt(filepath.length - 1);
  if ((filePathLast === "/" || filePathLast === "\\") && resolved[resolved.length - 1] !== path.sep) resolved += "/";
  const outURL = new URL("file://");
  if (resolved.includes("%")) resolved = resolved.replace(percentRegEx, "%25"); // In posix, "/" is a valid character in paths

  if (!isWindows && resolved.includes("\\")) resolved = resolved.replace(backslashRegEx, "%5C");
  if (resolved.includes("\n")) resolved = resolved.replace(newlineRegEx, "%0A");
  if (resolved.includes("\r")) resolved = resolved.replace(carriageReturnRegEx, "%0D");
  if (resolved.includes("\t")) resolved = resolved.replace(tabRegEx, "%09");
  outURL.pathname = resolved;
  return outURL;
};

const pathToFileURL = url.pathToFileURL || pathToFileURLPolyfill;

const {
  platform: platform$1
} = process;
const isWindows$1 = platform$1 === "win32";
const CHAR_LOWERCASE_A = 97;
const CHAR_LOWERCASE_Z = 122; // https://github.com/nodejs/node/blob/f185990738ca6eb781328bfec65c416b5415d1fc/lib/internal/url.js#L1334

const fileURLToPathPolyfill = path => {
  if (typeof path === "string") path = new URL(path);else if (path === null || typeof path !== "object") throw new Error(`path must be a string or an url`);
  if (path.protocol !== "file:") throw new Error("unexpected url sheme, must be file");
  return isWindows$1 ? getPathFromURLWin32(path) : getPathFromURLPosix(path);
};

const forwardSlashRegEx = /\//g;

function getPathFromURLWin32(url) {
  const hostname = url.hostname;
  var pathname = url.pathname;

  for (var n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      var third = pathname.codePointAt(n + 2) | 0x20;

      if (pathname[n + 1] === "2" && third === 102 || // 2f 2F /
      pathname[n + 1] === "5" && third === 99) {
        // 5c 5C \
        throw new Error("must not include encoded \\ or / characters");
      }
    }
  }

  pathname = pathname.replace(forwardSlashRegEx, "\\");
  pathname = decodeURIComponent(pathname);

  if (hostname !== "") {
    // If hostname is set, then we have a UNC path
    // Pass the hostname through domainToUnicode just in case
    // it is an IDN using punycode encoding. We do not need to worry
    // about percent encoding because the URL parser will have
    // already taken care of that for us. Note that this only
    // causes IDNs with an appropriate `xn--` prefix to be decoded.
    return `\\\\${hostname}${pathname}`;
  } // Otherwise, it's a local path that requires a drive letter


  var letter = pathname.codePointAt(1) | 0x20;
  var sep = pathname[2];

  if (letter < CHAR_LOWERCASE_A || letter > CHAR_LOWERCASE_Z || // a..z A..Z
  sep !== ":") {
    throw new Error("must be absolute");
  }

  return pathname.slice(1);
}

function getPathFromURLPosix(url) {
  if (url.hostname !== "") {
    throw new Error(`invalid file url host for ${platform$1} platform`);
  }

  const pathname = url.pathname;

  for (var n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      var third = pathname.codePointAt(n + 2) | 0x20;

      if (pathname[n + 1] === "2" && third === 102) {
        throw new Error("must not include encoded / characters");
      }
    }
  }

  return decodeURIComponent(pathname);
}

const fileURLToPath = url.fileURLToPath || fileURLToPathPolyfill;

const NATIVE_NODE_MODULE_SPECIFIER_ARRAY = ["assert", "async_hooks", "buffer_ieee754", "buffer", "child_process", "cluster", "console", "constants", "crypto", "_debugger", "dgram", "dns", "domain", "events", "freelist", "fs", "fs/promises", "_http_agent", "_http_client", "_http_common", "_http_incoming", "_http_outgoing", "_http_server", "http", "http2", "https", "inspector", "_linklist", "module", "net", "node-inspect/lib/_inspect", "node-inspect/lib/internal/inspect_client", "node-inspect/lib/internal/inspect_repl", "os", "path", "perf_hooks", "process", "punycode", "querystring", "readline", "repl", "smalloc", "_stream_duplex", "_stream_transform", "_stream_wrap", "_stream_passthrough", "_stream_readable", "_stream_writable", "stream", "string_decoder", "sys", "timers", "_tls_common", "_tls_legacy", "_tls_wrap", "tls", "trace_events", "tty", "url", "util", "v8/tools/arguments", "v8/tools/codemap", "v8/tools/consarray", "v8/tools/csvparser", "v8/tools/logreader", "v8/tools/profile_view", "v8/tools/splaytree", "v8", "vm", "worker_threads", "zlib", // global is special
"global"];
const isNativeNodeModuleBareSpecifier = specifier => NATIVE_NODE_MODULE_SPECIFIER_ARRAY.includes(specifier);

const isNativeBrowserModuleBareSpecifier = () => false;

// https://github.com/benmosher/eslint-plugin-import/blob/master/resolvers/node/index.js
const interfaceVersion = 2;
const resolve = (source, file, {
  logLevel,
  projectDirectoryPath,
  importMapFileRelativePath = "./importMap.json",
  insideProjectAssertion = false,
  defaultExtension = false,
  node = false,
  browser = false
}) => {
  if (typeof projectDirectoryPath !== "string") {
    throw new TypeError(`projectDirectoryPath must be a string, got ${projectDirectoryPath}`);
  }

  const projectDirectoryUrl = pathToDirectoryUrl(projectDirectoryPath);
  let importMap;

  if (typeof importMapFileRelativePath === "undefined") {
    importMap = undefined;
  } else if (typeof importMapFileRelativePath === "string") {
    const importMapFileUrl = String(new URL(importMapFileRelativePath, projectDirectoryUrl));

    if (insideProjectAssertion && !urlIsInsideProject(importMapFileUrl, projectDirectoryUrl)) {
      throw new Error(`import map file must be inside project.
--- import map file url ---
${importMapFileUrl}
--- project directory path ---
${projectDirectoryPath}`);
    }

    try {
      const importMapFilePath = fileURLToPath(importMapFileUrl);
      const importMapFileBuffer = fs.readFileSync(importMapFilePath);
      const importMapFileString = String(importMapFileBuffer);
      importMap = JSON.parse(importMapFileString);
      importMap = normalizeImportMap(importMap, projectDirectoryUrl);
    } catch (e) {
      if (e && e.code === "ENOENT") {
        importMap = {};
      } else {
        throw e;
      }
    }
  } else {
    throw new TypeError(`importMapFileRelativePath must be a string, got ${importMapFileRelativePath}`);
  }

  const logger = createLogger({
    logLevel
  });
  logger.debug(`
resolve import for project.
--- specifier ---
${source}
--- importer ---
${file}
--- project directory path ---
${projectDirectoryPath}`);

  if (node && isNativeNodeModuleBareSpecifier(source)) {
    logger.debug(`-> native node module`);
    return {
      found: true,
      path: null
    };
  }

  if (browser && isNativeBrowserModuleBareSpecifier()) {
    logger.debug(`-> native browser module`);
    return {
      found: true,
      path: null
    };
  }

  const specifier = source;
  const importer = String(pathToFileURL(file));

  try {
    const importUrl = resolveImport({
      specifier,
      importer,
      importMap,
      defaultExtension
    });

    if (importUrl.startsWith("file://")) {
      const importFilePath = fileURLToPath(importUrl);

      if (insideProjectAssertion && !urlIsInsideProject(importUrl, projectDirectoryUrl)) {
        return {
          found: false,
          path: importFilePath
        };
      }

      if (pathLeadsToFile(importFilePath)) {
        logger.debug(`-> found file at ${importUrl}`);
        return {
          found: true,
          path: importFilePath
        };
      }

      logger.debug(`-> file not found at ${importUrl}`);
      return {
        found: false,
        path: importFilePath
      };
    }

    if (importUrl.startsWith("https://") || importUrl.startsWith("http://")) {
      // this api is synchronous we cannot check
      // if a remote http/https file is available
      logger.debug(`-> consider found because of http(s) scheme ${importUrl}`);
      return {
        found: true,
        path: null
      };
    }

    logger.debug(`-> consider not found because of scheme ${importUrl}`);
    return {
      found: false,
      path: null
    };
  } catch (e) {
    logger.error(e.stack);
    return {
      found: false,
      path: null
    };
  }
};

const pathToDirectoryUrl = (specifier, baseUrl) => {
  const url = String(pathToFileURL(specifier, baseUrl));

  if (url.endsWith("/")) {
    return url;
  }

  return `${url}/`;
};

const urlIsInsideProject = (url, projectDirectoryUrl) => {
  return url.startsWith(projectDirectoryUrl);
};

const pathLeadsToFile = path => {
  try {
    const stat = fs.statSync(path);
    return stat.isFile();
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return false;
    }

    throw e;
  }
};

exports.interfaceVersion = interfaceVersion;
exports.resolve = resolve;
//# sourceMappingURL=main.js.map
