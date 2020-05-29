import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.mjs',
      format: 'es', // the preferred format
      sourcemap: true,
    },
  ],
  external: [
    'svelte/store',
  ],
  plugins: [
    copy({
      targets: [
        { src: 'src/components', dest: 'dist' },
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
