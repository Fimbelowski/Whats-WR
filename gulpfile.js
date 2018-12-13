var gulp = require('gulp');
var sass = require('gulp-sass');
var concatCss = require('gulp-concat-css');
var cleanCSS = require('gulp-clean-css');

var imagemin = require('gulp-imagemin');

var minify = require('gulp-minify');
var concat = require('gulp-concat');

var del = require('del');

gulp.task('sass', function() {
  return gulp.src(['src/scss/_variables.scss', 'src/scss/base.scss',
                    'src/scss/layout.scss', 'src/scss/modules/*.scss',
                    'src/scss/media-queries.scss', 'src/scss/state.scss'])
  .pipe(sass().on('error', sass.logError))
  .pipe(concatCss('styles.css'))
  .pipe(cleanCSS())
  .pipe(gulp.dest('dist/css'));
});

gulp.task('sass:watch', function() {
  gulp.watch('src/scss/**/*.scss', ['sass']);
});

gulp.task('images', function() {
  gulp.src('src/images/**/*')
  .pipe(imagemin([
    imagemin.jpegtran(),
    imagemin.optipng()
  ]))
  .pipe(gulp.dest('dist/images'));
});

gulp.task('js', function() {
  gulp.src(['src/js/**/*.js', '!src/js/vue.js'])
  .pipe(concat('main.js'))
  .pipe(minify({ ext: { min: '.js' }, noSource: true }))
  .pipe(gulp.dest('dist/js'));
});

gulp.task('js:watch', function() {
  gulp.watch('src/js/**/*.js', ['js']);
});

gulp.task('clean', function() {
  del(['*', '!dist/**', '!index.html']);
});

gulp.task('watch', ['sass:watch', 'js:watch']);

gulp.task('default', ['sass', 'images', 'js']);
