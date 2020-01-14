import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import {terser} from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.ts', // our source file
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es', // the preferred format
      sourcemap: true,
    },
  ],
  external: [
    'svelte/store',
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
    production && terser(), // minifies generated bundles
  ]
};