import { parse } from 'path';
import del from 'rollup-plugin-delete';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: {
    index: 'src/index.ts',
    validators: 'src/validators.ts',
  },
  output: [
    {
      dir: parse(pkg.main).dir,
      format: 'cjs',
      sourcemap: true,
    },
    {
      dir: parse(pkg.module).dir,
      format: 'es', // the preferred format
      sourcemap: true,
    },
  ],
  external: [
    'svelte/store',
  ],
  plugins: [
    del({
      targets: ['dist/*', '!dist/package.json'],
      runOnce: !production,
      verbose: !production,
    }),
    typescript({
      typescript: require('typescript'),
    }),
    production && terser(), // minifies generated bundles
  ]
};