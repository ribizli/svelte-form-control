import resolve from '@rollup/plugin-node-resolve';
import { parse } from 'path';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';


const production = !process.env.ROLLUP_WATCH;

export default {
  input: {
    index: 'src/index.ts',
    validators: 'src/validators.ts',
    components: 'src/components/index.js',
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
    copy({
      targets: [
        { src: 'src/components/**/*.svelte', dest: 'dist/components' },
        { 
          src: 'src/components/index.js', 
          dest: 'dist/components',
          transform: (contents) => contents.toString() + `export * from '../esm';`,
        },
      ],
      verbose: !production,
    }),
    typescript({
      typescript: require('typescript'),
    }),

    svelte(),
    resolve({
      dedupe: ['svelte']
    }),

    production && terser(), // minifies generated bundles
  ]
};