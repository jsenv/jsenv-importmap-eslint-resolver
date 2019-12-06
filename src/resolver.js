// https://github.com/benmosher/eslint-plugin-import/blob/master/resolvers/node/index.js
// https://github.com/benmosher/eslint-plugin-import/tree/master/resolvers
// https://github.com/olalonde/eslint-import-resolver-babel-root-import

import { readFileSync, statSync } from "fs"
import { createLogger } from "@jsenv/logger"
import { normalizeImportMap, resolveImport, resolveUrl } from "@jsenv/import-map"
import { urlToFilePath, filePathToUrl } from "./internal/urlUtils.js"
import { normalizeDirectoryUrl } from "./internal/normalizeDirectoryUrl.js"
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
    insideProjectAssertion = false,
    defaultExtension = false,
    node = false,
    browser = false,
  },
) => {
  const logger = createLogger({ logLevel })

  projectDirectoryUrl = normalizeDirectoryUrl(projectDirectoryUrl)

  let importMap
  if (typeof importMapFileRelativeUrl === "undefined") {
    importMap = undefined
  } else if (typeof importMapFileRelativeUrl === "string") {
    const importMapFileUrl = resolveUrl(importMapFileRelativeUrl, projectDirectoryUrl)

    if (insideProjectAssertion && !urlIsInsideProject(importMapFileUrl, projectDirectoryUrl)) {
      throw new Error(`import map file must be inside project.
--- import map file url ---
${importMapFileUrl}
--- project directory url ---
${projectDirectoryUrl}`)
    }

    try {
      const importMapFilePath = urlToFilePath(importMapFileUrl)
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

  logger.debug(`
resolve import for project.
--- specifier ---
${source}
--- importer ---
${file}
--- project directory url ---
${projectDirectoryUrl}`)

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
  const importer = filePathToUrl(file)

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
      const importFilePath = urlToFilePath(importUrl)

      if (insideProjectAssertion && !urlIsInsideProject(importUrl, projectDirectoryUrl)) {
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

const urlIsInsideProject = (url, projectDirectoryUrl) => {
  return url.startsWith(projectDirectoryUrl)
}

const pathLeadsToFile = (path) => {
  try {
    const stat = statSync(path)
    return stat.isFile()
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return false
    }
    throw e
  }
}
