var sys = require('sys');
var exec = require('child_process').exec;

var gulp = require('gulp');
var traceur = require('gulp-traceur');
var sass = require('gulp-sass');

gulp.task('js', function() {
	//Build Traceur
	gulp.src('./src/**/*.js')
		.pipe(traceur())
		.pipe(gulp.dest('./c/'));

	return gulp.src('./src/**/*.json')
		.pipe(gulp.dest('./c/'));
});

gulp.task('css', function() {
	//Build Sass
	return gulp.src('./styles/*.scss')
		.pipe(sass({ includePaths: ['styles/'] }))
		.pipe(gulp.dest('./c/styles/'));
});

gulp.task('post-build', ['js', 'css'], function() {
	exec("nw.exe .");
});

gulp.task('default', function() {
	gulp.start('js', 'css', 'post-build');
});