import { resolve, sep } from "path"
import { pathToFileURL as pathToFileURLNode } from "url"

// https://github.com/nodejs/node/blob/f185990738ca6eb781328bfec65c416b5415d1fc/lib/internal/url.js#L1361
const { platform } = process
const isWindows = platform === "win32"
const percentRegEx = /%/g
const backslashRegEx = /\\/g
const newlineRegEx = /\n/g
const carriageReturnRegEx = /\r/g
const tabRegEx = /\t/g
const pathToFileURLPolyfill = (filepath) => {
  let resolved = resolve(filepath)
  // path.resolve strips trailing slashes so we must add them back
  const filePathLast = filepath.charCodeAt(filepath.length - 1)
  if ((filePathLast === "/" || filePathLast === "\\") && resolved[resolved.length - 1] !== sep)
    resolved += "/"
  const outURL = new URL("file://")
  if (resolved.includes("%")) resolved = resolved.replace(percentRegEx, "%25")
  // In posix, "/" is a valid character in paths
  if (!isWindows && resolved.includes("\\")) resolved = resolved.replace(backslashRegEx, "%5C")
  if (resolved.includes("\n")) resolved = resolved.replace(newlineRegEx, "%0A")
  if (resolved.includes("\r")) resolved = resolved.replace(carriageReturnRegEx, "%0D")
  if (resolved.includes("\t")) resolved = resolved.replace(tabRegEx, "%09")
  outURL.pathname = resolved
  return outURL
}

export const pathToFileURL = pathToFileURLNode || pathToFileURLPolyfill
