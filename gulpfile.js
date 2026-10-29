import { rm } from 'node:fs/promises';
import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import * as esbuild from 'esbuild';
import browserSync from 'browser-sync';
import browserslistToEsbuild from 'browserslist-to-esbuild';

const { src, dest, watch: gulpWatch, series, parallel } = gulp;
const sass = gulpSass(dartSass);
const bs = browserSync.create();

// `gulp build --production` → мініфікація, без sourcemap
const isProd = process.argv.includes('--production');

const paths = {
  styles: {
    entry: 'src/scss/*.scss', // кожен файл без "_" у корені src/scss — окремий бандл
    watch: 'src/scss/**/*.scss',
    dest: 'assets/css',
  },
  scripts: {
    entry: 'src/js/*.js', // кожен файл у корені src/js — окремий бандл
    watch: 'src/js/**/*.js',
    dest: 'assets/js',
  },
  markup: ['*.html', '**/*.php', '!node_modules/**'],
};

export function clean() {
  return Promise.all([paths.styles.dest, paths.scripts.dest].map(dir => rm(dir, { recursive: true, force: true })));
}

export function styles() {
  return src(paths.styles.entry, { sourcemaps: !isProd })
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(postcss(isProd ? [autoprefixer(), cssnano()] : [autoprefixer()]))
    .pipe(dest(paths.styles.dest, { sourcemaps: isProd ? false : '.' }));
}

export async function scripts() {
  try {
    await esbuild.build({
      entryPoints: [paths.scripts.entry],
      outdir: paths.scripts.dest,
      bundle: true,
      format: 'iife',
      target: browserslistToEsbuild(), // з "browserslist" у package.json
      sourcemap: !isProd,
      minify: isProd,
      legalComments: 'none',
      logLevel: 'warning',
    });
  } catch (err) {
    // у watch-режимі помилка не повинна зупиняти процес; у build — повинна
    if (isProd) throw err;
  }
}

function reloadCss(done) {
  bs.reload('*.css');
  done();
}

function reload(done) {
  bs.reload();
  done();
}

function serve(done) {
  // BS_PROXY=http://ideal-health.local npm run dev — проксі на сайт Local;
  // без змінної — статичний сервер з кореня теми
  const proxy = process.env.BS_PROXY;
  bs.init(proxy ? { proxy, open: false, notify: false } : { server: '.', open: false, notify: false });
  done();
}

export function watch() {
  gulpWatch(paths.styles.watch, series(styles, reloadCss));
  gulpWatch(paths.scripts.watch, series(scripts, reload));
  gulpWatch(paths.markup, reload);
}

export const build = series(clean, parallel(styles, scripts));

export default series(build, serve, watch);
