//dependencies
var gulp = require('gulp');
var watch = require('gulp-watch');
var rimraf = require('gulp-rimraf');
var rename = require('gulp-rename');


gulp.task('setenv', function (done) {
  var argv = require('minimist')(process.argv.slice(2));
  console.log("setenvironment.argv",argv) ;

  var srcFile = "./src/environments/environment." + argv.env + ".ts" ;
  var targetFile = "./src/environments/environment.ts" ;
  var targetFile2 = "./src/environments/environment.prod.ts" ;

  console.log("sourceFile",srcFile) ;

  gulp.src(srcFile)
    .pipe(rename(targetFile))
    .pipe(gulp.dest('.'));

      gulp.src(srcFile)
    .pipe(rename(targetFile2))
    .pipe(gulp.dest('.'));
});


// copy dependencies to dist folder
gulp.task('copy:universal', function(){
  return gulp.src([
    'src/app/universal/**/*'
  ]).pipe(gulp.dest('../server/src/universal'))
    ;
});

gulp.task('copy:environments', function(){
  return gulp.src([
    'src/environments/**/*'
  ]).pipe(gulp.dest('../server/src/environments'))

    ;
});


//default task
gulp.task('default', ['copy:universal','copy:environments'], function(){
	  gulp.watch(['src/app/universal/**/*'],['copy:universal']);
    gulp.watch(['src/environments/**/*'],['copy:environments']);
});

