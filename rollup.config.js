import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'JsBridgeAdapter',
      file: 'dist/JsBridgeAdapter.min.js',
      format: 'umd',
      exports: 'named'
    },
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**'
      }),
      uglify()
    ]
  },
  {
    input: 'src/index.js',
    output: {
      name: 'JsBridgeAdapter',
      file: 'dist/JsBridgeAdapter.js',
      format: 'umd',
      exports: 'named'
    },
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**'
      })
    ]
  }
]
