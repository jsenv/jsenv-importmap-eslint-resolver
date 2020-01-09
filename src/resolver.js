// https://github.com/benmosher/eslint-plugin-import/blob/master/resolvers/node/index.js
// https://github.com/benmosher/eslint-plugin-import/tree/master/resolvers
// https://github.com/olalonde/eslint-import-resolver-babel-root-import

import { readFileSync, statSync } from "fs"
import { createLogger } from "@jsenv/logger"
import { normalizeImportMap, resolveImport } from "@jsenv/import-map"
import {
  assertAndNormalizeDirectoryUrl,
  resolveUrl,
  urlIsInsideOf,
  urlToFileSystemPath,
  fileSystemPathToUrl,
} from "@jsenv/util"
import { isNativeNodeModuleBareSpecifier } from "./internal/isNativeNodeModuleBareSpecifier.js"
import { isNativeBrowserModuleBareSpecifier } from "./internal/isNativeBrowserModuleBareSpecifier.js"

export const interfaceVersion = 2

export const resolve = (
  source,
  file,
  {
    logLevel,
    projectDirectoryUrl,
    importMapFileRelativeUrl = "./importMap.json",
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
    const importMapFileUrl = resolveUrl(importMapFileRelativeUrl, projectDirectoryUrl)

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
