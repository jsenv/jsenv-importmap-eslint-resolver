import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFilePath } from "../../src/internal/urlUtils.js"
import * as resolver from "../../index.js"

const testDirectoryUrl = import.meta.resolve("./")
const file = urlToFilePath(resolveUrl("./folder/foo.js", testDirectoryUrl))

{
  const actual = resolver.resolve("/file.js", file, {
    projectDirectoryUrl: testDirectoryUrl,
  })
  const expected = {
    found: false,
    path: `/file.js`,
  }
  assert({ actual, expected })
}
