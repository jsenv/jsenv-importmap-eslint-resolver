import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFilePath } from "../../src/internal/urlUtils.js"
import * as resolver from "../../index.js"

const testDirectoryUrl = import.meta.resolve("./")
const file = urlToFilePath(resolveUrl("./file.js", testDirectoryUrl))

{
  const actual = resolver.resolve("fs", file, {
    projectDirectoryUrl: testDirectoryUrl,
  })
  const expected = {
    found: false,
    path: null,
  }
  assert({ actual, expected })
}

{
  const actual = resolver.resolve("fs", file, {
    projectDirectoryUrl: testDirectoryUrl,
    node: true,
  })
  const expected = {
    found: true,
    path: null,
  }
  assert({ actual, expected })
}

{
  const actual = resolver.resolve("foo", file, {
    projectDirectoryUrl: testDirectoryUrl,
  })
  const expected = {
    found: false,
    path: null,
  }
  assert({ actual, expected })
}
