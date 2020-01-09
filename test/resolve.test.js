import { assert } from "@jsenv/assert"
import { ensureEmptyDirectory, resolveUrl, urlToFileSystemPath, writeFile } from "@jsenv/util"
import * as resolver from "../index.js"
// const resolver = import.meta.require("../../dist/commonjs/main.js")

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

// import starting with /
{
  const importerFileUrl = resolveUrl("dir/foo.js", tempDirectoryUrl)
  const resolvedFileUrl = resolveUrl("/file.js", tempDirectoryUrl)

  const actual = resolver.resolve("/file.js", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl: tempDirectoryUrl,
  })
  const expected = {
    found: false,
    path: urlToFileSystemPath(resolvedFileUrl),
  }
  assert({ actual, expected })
}

// import 'fs' outside node
{
  const importerFileUrl = resolveUrl("file", tempDirectoryUrl)

  const actual = resolver.resolve("fs", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl: tempDirectoryUrl,
    logLevel: "off",
  })
  const expected = {
    found: false,
    path: null,
  }
  assert({ actual, expected })
}

// import 'fs' inside node
{
  const importerFileUrl = resolveUrl("file", tempDirectoryUrl)

  const actual = resolver.resolve("fs", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl: tempDirectoryUrl,
    node: true,
  })
  const expected = {
    found: true,
    path: null,
  }
  assert({ actual, expected })
}

// bare specifier not mapped
{
  const importerFileUrl = resolveUrl("file", tempDirectoryUrl)

  const actual = resolver.resolve("foo", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl: tempDirectoryUrl,
    logLevel: "off",
  })
  const expected = {
    found: false,
    path: null,
  }
  assert({ actual, expected })
}

// bare specifier remapped
{
  const importerFileUrl = resolveUrl("src/babelTest.js", tempDirectoryUrl)
  const resolvedFileUrl = resolveUrl(
    "node_modules/@babel/plugin-proposal-object-rest-spread/lib/index.js",
    tempDirectoryUrl,
  )
  const importmapFileUrl = resolveUrl("importMap.json", tempDirectoryUrl)
  await writeFile(
    importmapFileUrl,
    JSON.stringify({
      imports: {
        "@babel/plugin-proposal-object-rest-spread":
          "./node_modules/@babel/plugin-proposal-object-rest-spread/lib/index.js",
      },
    }),
  )

  const actual = resolver.resolve(
    "@babel/plugin-proposal-object-rest-spread",
    urlToFileSystemPath(importerFileUrl),
    {
      projectDirectoryUrl: tempDirectoryUrl,
    },
  )
  const expected = {
    found: false,
    path: urlToFileSystemPath(resolvedFileUrl),
  }
  assert({ actual, expected })
}

// bare specifier remapped by scope
{
  const importerFileUrl = resolveUrl("node_modules/use-scoped-foo/index.js", tempDirectoryUrl)
  const resolvedFileUrl = resolveUrl(
    "node_modules/use-scoped-foo/node_modules/foo/index.js",
    tempDirectoryUrl,
  )
  const importmapFileUrl = resolveUrl("importMap.json", tempDirectoryUrl)
  await writeFile(
    importmapFileUrl,
    JSON.stringify({
      scopes: {
        "./node_modules/use-scoped-foo/": {
          foo: "./node_modules/use-scoped-foo/node_modules/foo/index.js",
        },
      },
    }),
  )

  const actual = resolver.resolve("foo", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl: tempDirectoryUrl,
  })
  const expected = {
    found: false,
    path: urlToFileSystemPath(resolvedFileUrl),
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// import an http url
{
  const importerFileUrl = resolveUrl("file", tempDirectoryUrl)

  const actual = resolver.resolve(
    "http://domain.com/file.js",
    urlToFileSystemPath(importerFileUrl),
    {
      projectDirectoryUrl: tempDirectoryUrl,
    },
  )
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

// sibling file from top level project file
{
  const importerFileUrl = resolveUrl("project/importer", tempDirectoryUrl)
  const resolvedFileUrl = resolveUrl("project/file", tempDirectoryUrl)
  const projectDirectoryUrl = resolveUrl("project", tempDirectoryUrl)
  await writeFile(importerFileUrl)
  await writeFile(resolvedFileUrl)

  const actual = resolver.resolve("./file", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl,
  })
  const expected = {
    found: true,
    path: urlToFileSystemPath(resolvedFileUrl),
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// parent from project directory
{
  const importerFileUrl = resolveUrl("project/dir/importer", tempDirectoryUrl)
  const resolvedFileUrl = resolveUrl("project/file", tempDirectoryUrl)
  const projectDirectoryUrl = resolveUrl("project", tempDirectoryUrl)
  await writeFile(importerFileUrl)
  await writeFile(resolvedFileUrl)

  const actual = resolver.resolve("../file", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl,
  })
  const expected = {
    found: true,
    path: urlToFileSystemPath(resolvedFileUrl),
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// parent from top level project file
{
  const importerFileUrl = resolveUrl("project/importer", tempDirectoryUrl)
  const resolvedFileUrl = resolveUrl("file", tempDirectoryUrl)
  const projectDirectoryUrl = resolveUrl("project", tempDirectoryUrl)
  await writeFile(importerFileUrl)
  await writeFile(resolvedFileUrl)

  const actual = resolver.resolve("../file", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl,
  })
  const expected = {
    found: true,
    path: urlToFileSystemPath(resolvedFileUrl),
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// parent from top level project file and ignoreOutside enabled
{
  const importerFileUrl = resolveUrl("project/importer", tempDirectoryUrl)
  const resolvedFileUrl = resolveUrl("file", tempDirectoryUrl)
  const projectDirectoryUrl = resolveUrl("project", tempDirectoryUrl)
  await writeFile(importerFileUrl)
  await writeFile(resolvedFileUrl)

  const actual = resolver.resolve("../file", urlToFileSystemPath(importerFileUrl), {
    projectDirectoryUrl,
    ignoreOutside: true,
  })
  const expected = {
    found: false,
    path: urlToFileSystemPath(resolvedFileUrl),
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
