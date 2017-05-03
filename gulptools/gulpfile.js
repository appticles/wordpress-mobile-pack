/**
 *
 * Usage:
 * For app 1: "gulp replace-reds --theme=1" -> generate clean scss file
 * For all apps: "gulp compile-default-theme --theme=2" -> compile css
 *
 */
var gulp = require('gulp'),
  sass = require('gulp-sass'),
  replace = require('gulp-batch-replace'),
  stripCssComments = require('gulp-strip-css-comments'),
  hex2rgb = require('hex2rgb'),
  concat = require('gulp-concat'),
  fs = require('fs'),
  argv = require('yargs').argv,
  insert = require('gulp-insert');


/**
 * Read JSON config file from the specified path
 * @param path
 */
function readConfigFile(path) {

  if (fs.existsSync(path))
    return JSON.parse(fs.readFileSync(path));
}


/**
 * Build list with the variables that will be replaced.
 * @param theme
 * @param colorVariables
 */
function buildReplacementList(theme, colorVariables) {

  var arrReplacements = [
    ['$paragraph-font', '$paragraphs-font']
  ];

  for (var i = 0; i < colorVariables['app' + String(theme)].length; i++) {
    var item = colorVariables['app' + String(theme)][i];
    var name = item.name;
    var hex = item.hex;
    var rgb = hex2rgb(hex).rgb;

    arrReplacements.push(
      [hex, name],
      [rgb.join(', '), name],
      [rgb.join(','), name]
    );
  }

  arrReplacements.push([/wbz\-custom\:(|\s| )(\'|\")/g, '']);
  return arrReplacements;
}

/**
 * Process scss file and replace reds with variables names.
 */
gulp.task('replace-reds', function () {

  if (argv.theme != null) {

    var theme = argv.theme;
    var json = readConfigFile('files/app' + String(theme) + '/replacements.json');

    if (json == null || json['app' + String(theme)] == null) {
      console.log('Invalid replacements json');
    } else {
      var arrReplacements = buildReplacementList(theme, json);

      return gulp.src(['files/app' + String(theme) + '/phone.scss'])
        .pipe(replace(arrReplacements))
        .pipe(stripCssComments())
        .pipe(gulp.dest('../frontend/themes/app' + String(theme) + '/scss/'));
    }

  } else {
    console.log('Missing theme argument');
  }
});

/**
 *
 * Create a variables file from the two config arrays
 *
 * @param colorVariables
 * @param fontsVariables
 *
 * @returns {string}
 */
function createVariablesFile(colorVariables, fontsVariables) {

  var contents = '';

  for (var color in colorVariables) {
    contents = contents + '$' + String(color) + ':' + String(colorVariables[color]) + ';\n';
  }

  for (var font in fontsVariables) {
    if (fontsVariables[font].indexOf('rem') >= 0)
      contents = contents + '$' + String(font) + ':' + String(fontsVariables[font]) + ';\n';
    else
      contents = contents + '$' + String(font) + ':"' + String(fontsVariables[font]) + '";\n';
  }

  return contents;
}

/**
 *
 * Compile CSS file for a single theme
 *
 */
gulp.task('compile-default-theme', function () {

  if (argv.theme != null) {

    var theme = argv.theme;
    var json = readConfigFile('../frontend/themes/app' + String(theme) + '/presets.json');

    if (json == null || json['vars'] == null || json['presets'] == null || json['fonts'] == null) {
      console.log('Missing colors or fonts from the SCSS config file');
    } else {

      // Merge variable names and color settings into a single object
      var colorVariables = {};
      for (var i = 0; i < json['vars'].length; i++) {
        colorVariables[ json['vars'][i] ] = json['presets']['1'][i];
      }

      // Create a string with all the variables settings
      var contents = createVariablesFile(colorVariables, json['fonts']);

      // Compile SCSS file and write it in the resources folder
      return gulp.src('../frontend/themes/app' + String(theme) + '/scss/phone.scss')
        .pipe(insert.prepend(contents))
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(gulp.dest('../frontend/themes/app' + String(theme) + '/css/'));
    }

  } else {
    console.log('Missing theme argument');
  }
});
