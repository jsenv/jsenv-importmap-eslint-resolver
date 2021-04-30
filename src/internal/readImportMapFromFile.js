import { readFileSync } from "fs"
import { normalizeImportMap } from "@jsenv/import-map"
import {
  resolveUrl,
  urlIsInsideOf,
  urlToFileSystemPath,
  ensureWindowsDriveLetter,
} from "@jsenv/util"

export const readImportMapFromFile = ({ projectDirectoryUrl, importMapFileRelativeUrl }) => {
  if (typeof importMapFileRelativeUrl === "undefined") {
    return {}
  }

  if (typeof importMapFileRelativeUrl !== "string") {
    throw new TypeError(
      `importMapFileRelativeUrl must be a string, got ${importMapFileRelativeUrl}`,
    )
  }
  const importMapFileUrl = applyUrlResolution(importMapFileRelativeUrl, projectDirectoryUrl)

  if (!urlIsInsideOf(importMapFileUrl, projectDirectoryUrl)) {
    console.warn(`import map file is outside project.
--- import map file ---
${urlToFileSystemPath(importMapFileUrl)}
--- project directory ---
${urlToFileSystemPath(projectDirectoryUrl)}`)
  }

  let importMapFileBuffer
  try {
    const importMapFilePath = urlToFileSystemPath(importMapFileUrl)
    importMapFileBuffer = readFileSync(importMapFilePath)
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return {}
    }
    throw e
  }

  let importMap
  try {
    const importMapFileString = String(importMapFileBuffer)
    importMap = JSON.parse(importMapFileString)
  } catch (e) {
    if (e && e.code === "SyntaxError") {
      console.error(e.stack)
      return {}
    }
    throw e
  }

  return normalizeImportMap(importMap, projectDirectoryUrl)
}

const applyUrlResolution = (specifier, importer) => {
  const url = resolveUrl(specifier, importer)
  return ensureWindowsDriveLetter(url, importer)
}
