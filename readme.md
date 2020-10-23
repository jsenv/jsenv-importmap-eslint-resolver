# importmap-eslint-resolver

Import maps resolution for ESLint.

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-importmap-eslint-resolver.svg?logo=github&label=package)](https://github.com/jsenv/jsenv-importmap-eslint-resolver/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/importmap-eslint-resolver.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/importmap-eslint-resolver)
[![github ci](https://github.com/jsenv/jsenv-importmap-eslint-resolver/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-importmap-eslint-resolver/actions?workflow=ci)
[![codecov coverage](https://codecov.io/gh/jsenv/jsenv-importmap-eslint-resolver/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-importmap-eslint-resolver)

# Table of contents

- [Presentation](#Presentation)
- [Installation](#installation)
  - [1/3 - Install eslint-plugin-import](#1/3---install-eslint-plugin-import)
  - [2/3 - Install importmap-eslint-resolver](#2/3---install-importmap-eslint-resolver)
  - [3/3 - Configure eslint](#3/3---configure-eslint)
- [Set importmap file path](#Set-importmap-file-path)
- [Bare specifier](#Bare-specifier)
- [Extensionless import](#extensionless-import)

# Presentation

Import maps are used to remap import to somewhere else. For instance the following importmap allows to remap `"foo"` to `"./foo.js"`.

```json
{
  "imports": {
    "foo": "./foo.js"
  }
}
```

By providing this importmap to the browser or Node.js, js imports resolution becomes aware of the importmap file remappings. You can write the following js file and it would search for file at `"./foo.js"`.

```js
import { value } from "foo"

console.log(value)
```

If you use `import/no-unresolved` rule from `eslint-plugin-import` these imports are reported as not resolved as shown in images below.

![screenshot import not resolved in vscode](./docs/vscode-import-not-resolved.png)</br >
![screenshot eslint error in vscode](./docs/eslint-error-in-vscode.png)

This is why `@jsenv/importmap-eslint-resolver` exists: to make `import/no-unresolved` compatible with importmap file.

— see [ESLint website](https://eslint.org)<br />
— see [eslint-plugin-import on github](https://github.com/benmosher/eslint-plugin-import)<br />
— see [importmap spec on github](https://github.com/WICG/import-maps)<br />

# Installation

Follow the steps below to enable importmap resolution for ESLint.

## 1/3 - Install eslint-plugin-import

If you already use this ESLint plugin you can skip this step.

```console
npm install --save-dev eslint-plugin-import
```

## 2/3 - Install importmap-eslint-resolver

```console
npm install --save-dev @jsenv/importmap-eslint-resolver
```

## 3/3 - Configure eslint

- Your eslint config must enable `eslint-plugin-import`
- Your eslint config must use `@jsenv/importmap-eslint-resolver` resolver

It means your minimal `.eslintrc.cjs` file looks like this:

```js
module.exports = {
  plugins: ["import"],
  settings: {
    "import/resolver": {
      [require.resolve("@jsenv/importmap-eslint-resolver")]: {
        projectDirectoryUrl: __dirname,
      },
    },
  },
}
```

# Set importmap file path

By default we will search for a file in your project directory named `import-map.importmap`. If the importmap file is located somewhere else you can use `importMapFileRelativeUrl` parameter to tell us where to look at.

```js
module.exports = {
  plugins: ["import"],
  settings: {
    "import/resolver": {
      [require.resolve("@jsenv/importmap-eslint-resolver")]: {
        projectDirectoryUrl: __dirname,
        importMapFileRelativeUrl: "./project.importmap",
      },
    },
  },
}
```

# Bare specifier

A specifier is what is written after the from keyword in an import statement.

```js
import value from "specifier"
```

If there is no mapping of `"specifier"` to `"./specifier.js"` the imported file will not be found.
This is because import map consider `"specifier"` as a special kind of specifier called bare specifier.
And every bare specifier must have a mapping or it cannot be resolved.
To fix this either add a mapping or put explicitely `"./specifier.js"`.

Please note that `"specifier.js"` is also a bare specifier. You should write `"./specifier.js"` instead.

# Extensionless import

Extensionless import means an import where the specifier omits the file extension.

```js
import { value } from "./file"
```

But these type of specifier are problematic: you don't know where to look at for the corresponding file.

- Is it `./file` ?
- Is it `./file.js` ?
- Is it `./file.ts` ?

The best solution to avoid configuring your brain and your browser is to keep the extension on the specifier.

```diff
- import { value } from './file'
+ import { value } from './file.js'
```

But if for some reason this is problematic you can still configure `@jsenv/importmap-eslint-resolver` to understand these extensionless specifiers.

```js
module.exports = {
  plugins: ["import"],
  settings: {
    "import/resolver": {
      [require.resolve("@jsenv/importmap-eslint-resolver")]: {
        projectDirectoryUrl: __dirname,
        defaultExtension: true,
      },
    },
  },
}
```

By passing `defaultExtension: true` you tell `@jsenv/importmap-eslint-resolver` to automatically add the importer extension when its omitted.

```js
import { value } from "./file"
```

Written in `index.js` search file at `file.js`.<br />
Written in `index.ts` search file at `file.ts`.
