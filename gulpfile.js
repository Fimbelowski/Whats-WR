var gulp = require('gulp'),
    sass = require('gulp-sass'),
    cleanCSS = require('gulp-clean-css'),
    changed = require('gulp-changed'),
    imagemin = require('gulp-imagemin');

// Configure build-css task.
gulp.task('build-css', function() {
    return gulp.src('source/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/css'));
});

// Configure a task to watch scss files and run build-scss on any changes.
gulp.task('build-css:watch', function() {
    gulp.watch('source/scss/**/*.scss', gulp.series('build-css'));
});

// Configure a task to optimize images.
gulp.task('imagemin', function() {
    var imgDist = 'dist/images'

    return gulp.src('source/images/*')
    .pipe(changed(imgDist))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDist));
});

// Configure the default task.
gulp.task('default', gulp.series('build-css', 'imagemin', 'build-css:watch'));