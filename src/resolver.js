// https://github.com/benmosher/eslint-plugin-import/blob/master/resolvers/node/index.js
// https://github.com/benmosher/eslint-plugin-import/tree/master/resolvers
// https://github.com/olalonde/eslint-import-resolver-babel-root-import

import { readFileSync, statSync, realpathSync } from "fs"
import { createLogger } from "@jsenv/logger"
import { normalizeImportMap, resolveImport } from "@jsenv/import-map"
import {
  assertAndNormalizeDirectoryUrl,
  resolveUrl,
  ensureWindowsDriveLetter,
  urlIsInsideOf,
  urlToFileSystemPath,
  fileSystemPathToUrl,
} from "@jsenv/util"
import { isNativeNodeModuleBareSpecifier } from "./internal/isNativeNodeModuleBareSpecifier.js"
import { isNativeBrowserModuleBareSpecifier } from "./internal/isNativeBrowserModuleBareSpecifier.js"

const applyUrlResolution = (specifier, importer) => {
  const url = resolveUrl(specifier, importer)
  return ensureWindowsDriveLetter(url, importer)
}

export const interfaceVersion = 2

export const resolve = (
  source,
  file,
  {
    logLevel,
    projectDirectoryUrl,
    importMapFileRelativeUrl = "./import-map.importmap",
    caseSensitive = true,
    ignoreOutside = false,
    defaultExtension = false,
    node = false,
    browser = false,
  },
) => {
  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

  let importMap
  if (typeof importMapFileRelativeUrl === "undefined") {
    importMap = undefined
  } else if (typeof importMapFileRelativeUrl === "string") {
    const importMapFileUrl = applyUrlResolution(importMapFileRelativeUrl, projectDirectoryUrl)

    if (ignoreOutside && !urlIsInsideOf(importMapFileUrl, projectDirectoryUrl)) {
      logger.warn(`import map file is outside project.
--- import map file ---
${urlToFileSystemPath(importMapFileUrl)}
--- project directory ---
${urlToFileSystemPath(projectDirectoryUrl)}`)
    }

    try {
      const importMapFilePath = urlToFileSystemPath(importMapFileUrl)
      const importMapFileBuffer = readFileSync(importMapFilePath)
      const importMapFileString = String(importMapFileBuffer)
      importMap = JSON.parse(importMapFileString)
      importMap = normalizeImportMap(importMap, projectDirectoryUrl)
    } catch (e) {
      if (e && e.code === "ENOENT") {
        importMap = {}
      } else {
        throw e
      }
    }
  } else {
    throw new TypeError(
      `importMapFileRelativeUrl must be a string, got ${importMapFileRelativeUrl}`,
    )
  }

  const logger = createLogger({ logLevel })

  logger.debug(`
resolve import for project.
--- specifier ---
${source}
--- importer ---
${file}
--- project directory path ---
${urlToFileSystemPath(projectDirectoryUrl)}`)

  if (node && isNativeNodeModuleBareSpecifier(source)) {
    logger.debug(`-> native node module`)
    return {
      found: true,
      path: null,
    }
  }

  if (browser && isNativeBrowserModuleBareSpecifier(source)) {
    logger.debug(`-> native browser module`)
    return {
      found: true,
      path: null,
    }
  }

  const specifier = source
  const importer = String(fileSystemPathToUrl(file))

  try {
    let importUrl
    try {
      importUrl = resolveImport({
        specifier,
        importer,
        importMap,
        defaultExtension,
      })
    } catch (e) {
      if (e.message.includes("bare specifier")) {
        // this is an expected error and the file cannot be found
        logger.debug("unmapped bare specifier")
        return {
          found: false,
          path: null,
        }
      }
      // this is an unexpected error
      throw e
    }
    importUrl = ensureWindowsDriveLetter(importUrl, importer)

    if (importUrl.startsWith("file://")) {
      const importFilePath = urlToFileSystemPath(importUrl)

      if (ignoreOutside && !urlIsInsideOf(importUrl, projectDirectoryUrl)) {
        logger.warn(`ignoring import outside project
--- import file ---
${importFilePath}
--- project directory ---
${urlToFileSystemPath(projectDirectoryUrl)}
`)
        return {
          found: false,
          path: importFilePath,
        }
      }

      if (pathLeadsToFile(importFilePath)) {
        if (caseSensitive) {
          const importFileRealPath = realpathSync.native(importFilePath)
          if (importFileRealPath !== importFilePath) {
            logger.warn(
              `WARNING: file found at ${importFilePath} but would not be found on a case sensitive filesystem.
The real file path is ${importFileRealPath}.
You can choose to disable this warning by disabling case sensitivity.
If you do so keep in mind windows users would not find that file.`,
            )
            return {
              found: false,
              path: importFilePath,
            }
          }
        }

        logger.debug(`-> found file at ${importUrl}`)
        return {
          found: true,
          path: importFilePath,
        }
      }

      logger.debug(`-> file not found at ${importUrl}`)
      return {
        found: false,
        path: importFilePath,
      }
    }

    if (importUrl.startsWith("https://") || importUrl.startsWith("http://")) {
      // this api is synchronous we cannot check
      // if a remote http/https file is available
      logger.debug(`-> consider found because of http(s) scheme ${importUrl}`)

      return {
        found: true,
        path: null,
      }
    }

    logger.debug(`-> consider not found because of scheme ${importUrl}`)
    return {
      found: false,
      path: null,
    }
  } catch (e) {
    logger.error(e.stack)
    return {
      found: false,
      path: null,
    }
  }
}

const pathLeadsToFile = (path) => {
  try {
    const stats = statSync(path)
    return stats.isFile()
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return false
    }
    throw e
  }
}
