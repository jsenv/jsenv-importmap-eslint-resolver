import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFilePath } from "../../src/internal/urlUtils.js"
import * as resolver from "../../index.js"

const testDirectoryUrl = import.meta.resolve("./")
const file = urlToFilePath(resolveUrl("./file.js", testDirectoryUrl))

{
  const actual = resolver.resolve("http://domain.com/file.js", file, {
    projectDirectoryUrl: testDirectoryUrl,
  })
  const expected = {
    found: true,
    // it's important to return null here and not the url
    // because eslint-plugin-import will try to read
    // file at this path and fail to do so
    // when it is an url
    path: null,
  }
  assert({ actual, expected })
}
