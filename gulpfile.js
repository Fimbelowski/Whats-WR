var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');

var imagemin = require('gulp-imagemin');

var minify = require('gulp-minify');

var del = require('del');

gulp.task('sass', function() {
  return gulp.src('src/scss/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(cleanCSS())
  .pipe(gulp.dest('dist/css'));
});

gulp.task('sass:watch', function() {
  gulp.watch('src/scss/*.scss', ['sass']);
});

gulp.task('images', function() {
  gulp.src('src/images/*')
  .pipe(imagemin())
  .pipe(gulp.dest('dist/images'));
});

gulp.task('js', function() {
  gulp.src('src/js/*.js')
  .pipe(minify({ noSource: true }))
  .pipe(gulp.dest('dist/js'));
});

gulp.task('js:watch', function() {
  gulp.watch('src/js/*.js', ['js']);
});

gulp.task('watch', ['sass:watch', 'js:watch']);

gulp.task('default', ['sass', 'images', 'js']);
