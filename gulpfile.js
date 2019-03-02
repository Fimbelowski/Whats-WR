var gulp = require('gulp'),
    sass = require('gulp-sass'),
    cleanCSS = require('gulp-clean-css'),
    changed = require('gulp-changed'),
    imagemin = require('gulp-imagemin'),
    vueify = require('gulp-vueify2'),
    concat = require('gulp-concat'),
    minify = require('gulp-minify'),
    rename = require('gulp-rename');

// Configure build-css task.
gulp.task('build-css', function() {
    return gulp.src('src/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist'));
});

// Configure a task to watch scss files and run build-scss on any changes.
gulp.task('build-css:watch', function() {
    gulp.watch('src/sass/**/*.scss', gulp.series('build-css'));
});

// Configure a task to optimize images.
gulp.task('imagemin', function() {
    var imgDist = 'dist/images'

    return gulp.src('src/images/*')
    .pipe(changed(imgDist))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDist));
});

// Configure vueify task
gulp.task('vueify', function() {
    return gulp.src('src/scripts/**/*.vue')
    .pipe(vueify())
    .pipe(minify({ noSource: true }))
    .pipe(gulp.dest('dist/'));
});

// Configure Vueify, and minification task.
gulp.task('scripts', function() {
    return gulp.src('src/scripts/**/*.vue')
    .pipe(vueify())
    .pipe(concat('app.js'))
    .pipe(minify({ noSource: true }))
    .pipe(rename({ dirname: '' }))
    .pipe(gulp.dest('./dist'));
});

// Configure the default task.
gulp.task('default', gulp.series('build-css', 'imagemin', 'build-css:watch'));