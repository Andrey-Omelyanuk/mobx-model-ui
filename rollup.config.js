// import typescript from '@rollup/plugin-typescript'
import typescript from 'rollup-plugin-typescript2'
// import { terser } from 'rollup-plugin-terser'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const dts = require('rollup-plugin-dts').default
import pkg from "./package.json"

const moduleName = pkg.name.replace(/^@.*\//, "")
const author = pkg.author
const banner = `
  /**
   * @license
   * author: ${author}
   * ${moduleName}.js v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`
export default [
    {
        input: './src/index.ts',
        output: [
            {   file        : pkg['main'],
                format      : "umd",
                // format      : "cjs",
                name        : 'mobx-model-ui',
                globals: {
                    'mobx': 'mobx'
                },
                sourcemap   : pkg['main'] + '.map',
                banner,
            },
            {   file        : pkg['jsnext:main'], 
                format      : "es",
                sourcemap   : pkg['jsnext:main'] + '.map',
                banner,
            }
        ],
        plugins   : [
            typescript({
                exclude: ["e2e/", "**/*.spec.ts"]
            }),
            // terser(),
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
        ],
    },
    {
        input: "./src/index.ts",
        // NOTE: The second output is your bundled `.d.ts` file
        output: [{ file: pkg['typings'] , format: "esm" }],
        // output: [{ file: pkg['typings'] , format: "es" }],
        plugins: [dts()],
    }
]
