import { fileURLToPath as fileURLToPathNode } from "url"

const { platform } = process
const isWindows = platform === "win32"
const CHAR_LOWERCASE_A = 97
const CHAR_LOWERCASE_Z = 122

// https://github.com/nodejs/node/blob/f185990738ca6eb781328bfec65c416b5415d1fc/lib/internal/url.js#L1334
const fileURLToPathPolyfill = (path) => {
  if (typeof path === "string") path = new URL(path)
  else if (path === null || typeof path !== "object")
    throw new Error(`path must be a string or an url`)
  if (path.protocol !== "file:") throw new Error("unexpected url sheme, must be file")
  return isWindows ? getPathFromURLWin32(path) : getPathFromURLPosix(path)
}

const forwardSlashRegEx = /\//g

function getPathFromURLWin32(url) {
  const hostname = url.hostname
  var pathname = url.pathname
  for (var n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      var third = pathname.codePointAt(n + 2) | 0x20
      if (
        (pathname[n + 1] === "2" && third === 102) || // 2f 2F /
        (pathname[n + 1] === "5" && third === 99)
      ) {
        // 5c 5C \
        throw new Error("must not include encoded \\ or / characters")
      }
    }
  }
  pathname = pathname.replace(forwardSlashRegEx, "\\")
  pathname = decodeURIComponent(pathname)
  if (hostname !== "") {
    // If hostname is set, then we have a UNC path
    // Pass the hostname through domainToUnicode just in case
    // it is an IDN using punycode encoding. We do not need to worry
    // about percent encoding because the URL parser will have
    // already taken care of that for us. Note that this only
    // causes IDNs with an appropriate `xn--` prefix to be decoded.
    return `\\\\${hostname}${pathname}`
  }
  // Otherwise, it's a local path that requires a drive letter
  var letter = pathname.codePointAt(1) | 0x20
  var sep = pathname[2]
  if (
    letter < CHAR_LOWERCASE_A ||
    letter > CHAR_LOWERCASE_Z || // a..z A..Z
    sep !== ":"
  ) {
    throw new Error("must be absolute")
  }
  return pathname.slice(1)
}

function getPathFromURLPosix(url) {
  if (url.hostname !== "") {
    throw new Error(`invalid file url host for ${platform} platform`)
  }
  const pathname = url.pathname
  for (var n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      var third = pathname.codePointAt(n + 2) | 0x20
      if (pathname[n + 1] === "2" && third === 102) {
        throw new Error("must not include encoded / characters")
      }
    }
  }
  return decodeURIComponent(pathname)
}

export const fileURLToPath = fileURLToPathNode || fileURLToPathPolyfill
