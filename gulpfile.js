'use strict';

const gulp = require('gulp');
const argv = require('yargs').argv;
const gutil = require('gulp-util');
const watch = require('gulp-watch');
const plumber = require('gulp-plumber'); // Prevent pipe breaking caused by errors from gulp plugins
const notify = require("gulp-notify");
const notifier = require('node-notifier');
const buffer = require('vinyl-buffer');
const prefixer = require('gulp-autoprefixer');
const include = require('gulp-file-include');
const sourcemaps = require('gulp-sourcemaps');
const rimraf = require('gulp-rimraf');
const connect = require('gulp-connect');
const htmlhint = require('gulp-htmlhint');
const less = require('gulp-less');
const lesshint = require('gulp-lesshint');
const cleanCSS = require('gulp-clean-css');
const csslint = require('gulp-csslint');
const chalk = require('chalk');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const spritesmith = require('gulp.spritesmith-multi');
const svgSprites	= require('gulp-svg-sprites'); // has bugs with symbol mode
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const filter = require('gulp-filter');
const raster = require('gulp-raster');
const rename = require('gulp-rename');
const open = require('gulp-open');
// rsp = require('remove-svg-properties').stream,

const beep = gutil.beep;

/* ****** */
/* Config */
/* ****** */

const version = "0.0";	// change it before release

// Path
const path = {
	build: { // Where to put ready files after build
		html: 'build/',
		js: 'build/js/',
		css: 'build/css/',
		minjs: 'build/minified/js/',
		mincss: 'build/minified/css/',
		img: 'build/img/',
		sprite: 'build/img/sprites/sprite.'+version,
		spritesym: 'build/img/sprites',
		fonts: 'build/fonts/'
	},
	src: { // Where to take source files
		html: 'source/*.html',
		js: 'source/js/js.js',
		style: 'source/css/*.less',
		stylesUrgent: 'source/css/urgent/*.less',
		stylesToValidate: ['source/css/partials/**/*.less', 'source/css/urgent/**/*.less'],
		spritestyle: 'source/css/generated/',
		img: 'source/img/common/**/*.*',
		sprite: 'source/img/sprite/',
		fonts: 'source/fonts/**/*.*'
	},
	watch: { // What files changes we want to track
		html:	['source/**/*.html'],
		js:		['source/js/**/*.js'],
		style:	['source/css/*.*ss', 'source/templates/**/*.*ss', 'source/css/partials/*.*ss'],
		styleUrgent:	['source/css/urgent/*.*ss'],
		img:	['source/img/common/**/*.*'],
		fonts:	['source/fonts/**/*.*'],
	},
	clean: {
		build: './build',
		style: 'source/css/generated'
	}
};

// dev server
const serverConfig = {
	port: argv.port || 9999,
	livereload: true,
	root: path.build.html
};

// AutopPrefixer config
const prefixerConfig = {
	browsers: ['> 1%','last 6 versions'],
	cascade: false
}

const config = {
	cleanCssCompatibility: 'ie8'
}

/* **************** */
/* Errors reporters */
/* **************** */

// HTML
const onHtmlError = function(err) {
	notify.onError({
		title:		"HTML error",
		subtitle:	"Failure!",
		message:	"<%= error.message %>",
		sound:		"Beep"
	})(err)
};

// HTML hint reporter
const htmlHintReporter = function(file) {
	const errorCount = file.htmlhint.errorCount;
	const plural = errorCount === 1 ? '' : 's';

	notifier.notify({
		'title': 'HTML error'+plural,
		'message': 'You have ' + errorCount + ' HTML error'+plural+'!'
	});
	beep();

	console.log(chalk.cyan(errorCount) + ' error' + plural + ' found in ' + chalk.magenta(file.path));

	getMessagesForFile(file).forEach(function (data) {
		console.log(data.message);
		console.log(data.evidence);
	});
}

function getMessagesForFile(file) {
	'use strict';
	return file.htmlhint.messages.map(function (msg) {
		const message = msg.error;
		let evidence = message.evidence;
		const line = message.line;
		const col = message.col;
		let detail;

		if (line) {
			detail = chalk.yellow('L' + line) + chalk.red(':') + chalk.yellow('C' + col);
		} else {
			detail = chalk.yellow('GENERAL');
		}

		if (col === 0) {
			evidence = chalk.red('?') + evidence;
		} else if (col > evidence.length) {
			evidence = chalk.red(evidence + ' ');
		} else {
			evidence = evidence.slice(0, col - 1) + chalk.red(evidence[col - 1]) + evidence.slice(col);
		}

		return {
			message: chalk.red('[') + detail + chalk.red(']') + chalk.yellow(' ' + message.message) + ' (' + message.rule.id + ')',
			evidence: evidence
		};
	});
}

// Styles
const onStyleError = function(err) {
	console.log(err);
	notify.onError({
		title:		"Styles error",
		subtitle:	"Failure!",
		message:	"<%= error.message %>",
		sound:		"Beep"
	})(err)
};

// CSSlint reporter
const cssLintReporter = {
	totalErrors: 0,
	totalWarnings: 0,

	id: 'string', // Name passed to csslint.formatter
	name: 'st',
	startFormat: function() {
		this.totalErrors = 0;
		this.totalWarnings = 0;

		return '';
	}, // Called before parsing any files, should return a string
	endFormat: function() {
		const warnings = this.totalWarnings;
		const errors = this.totalErrors;
		if (errors)
			notifier.notify({
				'title': 'CSS errors',
				'message': 'You have ' + errors + ' CSS errors!'
			});
		if (warnings)
			notifier.notify({
				'title': 'CSS warnings',
				'message': 'You have ' + warnings + ' CSS warnings!'
			});
		return '';
	}, // Called after parsing all files, should return a string
	formatResults: function (results, filename, options) {
		const messages = results.messages;
		const _this = this;

		messages.map(function (_ref3) {
			let output = "";
			const message = _ref3.message;
			const line = _ref3.line;
			const col = _ref3.col;
			const type = _ref3.type;
			const isWarning = type === 'warning';

			const fileNameArr = filename.replace(/[\\]/g,"/").split("/");
			const fileName = fileNameArr[fileNameArr.length - 1];

			if (isWarning) {
			  _this.totalWarnings++;
			} else {
			  _this.totalErrors++;
			}

			output += ( isWarning ? chalk.yellow(type) : chalk.red(type) ) + ": ";
			output += chalk.cyan(fileName) + ": ";
			output += chalk.magenta('line ' + line) + ", " + chalk.magenta('col ' + col) + ", ";
			output += chalk.green(_ref3.rule.id) + ": ";
			output += message;
			console.log(output);
		});
	} // Called with a results-object per file linted. Optionally called with a filename, and options passed to csslint.formatter(*formatter*, *options*)
};

// Scripts
const onScriptError = function(err) {
	console.log(err);
	notify.onError({
		title:    "Script error",
		subtitle: "Failure!",
		message:  "<%= error.message %>",
		sound:    "Beep"
	})(err)
};


/* ***** */
/* TASKS */
/* ***** */

// clean project
gulp.task('clean', function () {
	return gulp.src([path.clean.build, path.clean.style], { allowEmpty: true})
		.pipe(rimraf());
});

// build fonts
gulp.task('fonts:build', function() {
	return gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.build.fonts))
});

// build HTML
gulp.task('html:build', function () {
	return gulp.src(path.src.html)
		.pipe(plumber({errorHandler : onHtmlError}))	// Перехватим ошибки
		.pipe(include())								// Прогоним через file include
		.pipe(htmlhint({								// Проверим валидность
			'attr-lowercase': false,
			'spec-char-escape': false
		}))
		.pipe(htmlhint.reporter(htmlHintReporter))		// Show validation info
		.pipe(gulp.dest(path.build.html))				// Выплюнем их в папку build
		.pipe(connect.reload());						// И перезагрузим наш сервер для обновлений
});

// check styles
gulp.task('style:check', function(){
	return gulp.src(path.src.stylesToValidate)
		.pipe(lesshint({ // Validate LESS
			propertyOrdering: {
				enabled: false
			}
		}))
		.pipe(lesshint.reporter('lib/lesshint.reporter.js'))
		.pipe(include())
		.pipe(less()) // Compile LESS
		.pipe(csslint({ // Validate CSS
			'adjoining-classes': false,
			'order-alphabetical': false,
			'unqualified-attributes': false,
			'box-sizing': false,
			'box-model': false
		}))
		.pipe(csslint.formatter(cssLintReporter));
});

// build CSS
gulp.task('style:build', function () {
	return gulp.src(path.src.style)
		.pipe(plumber({errorHandler : onStyleError}))
		.pipe(include()) // Enable @@includes
		.pipe(sourcemaps.init())
		.pipe(less()) // Compile LESS
		.pipe(prefixer(prefixerConfig)) // Add vendor prefixes
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.css))	// выплюнем неминифицырованый файл
		.pipe(cleanCSS({					// минифицируем
			compatibility: config.cleanCssCompatibility,
			keepSpecialComments: 0,
			roundingPrecision: 3
		}))
		.pipe(gulp.dest(path.build.mincss))	// выплюнем минифицырованный файл
		.pipe(connect.reload());
});

// compile styles, that are built in html
gulp.task('style:urgent', function () {
	return gulp.src(path.src.stylesUrgent)
		.pipe(plumber({errorHandler : onStyleError}))
		.pipe(include())
		.pipe(sourcemaps.init())
		.pipe(less())						// скомпилируем LESS
		.pipe(prefixer(prefixerConfig))		// добавим вендорные префиксы
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.css))	// выплюнем неминифицырованый файл
		.pipe(cleanCSS({					// минифицируем
			compatibility: config.cleanCssCompatibility,
			keepSpecialComments: 0,
			roundingPrecision: 3
		}))
		.pipe(gulp.dest(path.src.spritestyle));	// выплюнем минифицырованный файл
});

// build JS
gulp.task('js:build', function () {
	return gulp.src(path.src.js)
		.pipe(plumber({errorHandler : onScriptError}))
		.pipe(include())
		.pipe(sourcemaps.write())
		.pipe(sourcemaps.init())
		.pipe(gulp.dest(path.build.js))		// выплюнем неминифицырованый файл
		.pipe(uglify())						// Сожмем JS
		.pipe(gulp.dest(path.build.minjs))	// выплюнем минифицырованный файл
		.pipe(connect.reload());
});

// build images
gulp.task('image:build', function () {
	return gulp.src(path.src.img)			// Выберем наши картинки
		.pipe(imagemin({					// compress them
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()],
			interlaced: true
		}))
		.pipe(gulp.dest(path.build.img))	// And put into build
		.pipe(connect.reload());
});

// build sprite
// use inner folders for different sprites
// All img names must vary
gulp.task('image:sprite', function () {
	const spriteData = gulp.src([
		path.src.sprite + '**/*.png',
		path.src.sprite + '**/*.gif',
		path.src.sprite + '**/*.jpg',
		path.src.sprite + '**/*.jpeg',
		path.src.sprite + '**/*.ico'
	])
	.pipe(spritesmith({
		spritesmith: function (options, sprite, icons) {
			options.cssTemplate = '';
			options.cssFormat = 'less';
			options.cssName = sprite + '.less';
			options.imgName = sprite + '.png';
			options.imgPath = '../img/sprites/sprite.'+version+'/' + options.imgName;
		}
	}));

	// Pipe image stream through image optimizer and onto disk
	const imgStream = spriteData.img
		// DEV: We must buffer our stream into a Buffer for `imagemin`
		.pipe(buffer())
		.pipe(imagemin({ // compress them
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()],
			interlaced: true
		}))
		.pipe(gulp.dest(path.build.sprite));

	return spriteData.css.pipe(gulp.dest(path.src.spritestyle))	// save styles
	.pipe(connect.reload());
});

// build svg sprites
gulp.task('image:svgsprite', function () {
	// Todo: seems there are some issues with SVG-sprites, need to verify
	return gulp.src(path.src.sprite + '*.svg')
		.pipe(svgSprites({
			cssFile: path.src.spritestyle + 'sprite-svg.less',
			svg: {
				sprite: path.build.sprite + '/sprite.svg'
			},
			preview: false,
			svgPath: '../img/sprites/sprite.'+version+'/sprite.svg',
			pngPath: '../img/sprites/sprite.'+version+'/sprite-svg.png',
			padding: 1,
			common: 'ico-svg',
			templates: {
				css: require('fs').readFileSync('lib/sprite-svg.less', 'utf-8')
			}
		}))
		.pipe(gulp.dest('./'))
		// png fallback
		.pipe(filter("**/*.svg"))
		.pipe(raster())
		.pipe(rename({extname: '-svg.png'}))
		.pipe(gulp.dest('./'))
		.pipe(connect.reload());
});

// build svg sprites (symbol mode)
gulp.task('image:svgspritesymbol', function () {
	return gulp.src(path.src.sprite + 'symbol/**/*.svg')
		// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// ToDo: rsp doesn't work with node > v12, need to replace
		// remove all fill, style and stroke declarations in out shapes
		// .pipe(rsp.remove({
		// 	properties: [rsp.PROPS_FILL, rsp.PROPS_STROKE, 'style']
		// }))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: '../sprite-sym.svg',
					render: {
						less: {
							dest: '../../../../' + path.src.spritestyle+'sprite-sym.less',
							template: 'lib/sprite_symbol_template.less'
						}
					}
				}
			}
		}))
		.pipe(gulp.dest(path.build.spritesym))
		.pipe(connect.reload());
});

// start all image functions
gulp.task('image', gulp.series(
	'image:build',
	'image:sprite',
	'image:svgsprite',
	'image:svgspritesymbol'
));

// Run server
gulp.task('runserver', function(doneCallback) {
	connect.server(serverConfig, doneCallback);
});

gulp.task('reload', function() {
	return gulp.src(path.src.js)			// ad-hoc solution, no matter which src is
		.pipe(connect.reload());
});

// Watch changes
gulp.task('watch', function (doneCallback) {
	// fonts
	watch(
		path.watch.fonts,
		gulp.series('fonts:build')
	);

	// html
	watch(
		path.watch.html,
		gulp.series('html:build')
	);

	// css
	watch(
		path.watch.style,
		gulp.series('style:check', 'style:build')
	);

	// css urgent
	watch(
		path.watch.styleUrgent,
		gulp.parallel('style:check', 'style:urgent', 'html:build')
	);

	// JS
	watch(
		path.watch.js,
		gulp.series('js:build')
	);

	// images
	watch(
		path.watch.img,
		gulp.parallel('image:build', 'style:build')
	);

	// sprites
	watch(
		[
			path.src.sprite + '**/*.png',
			path.src.sprite + '**/*.gif',
			path.src.sprite + '**/*.jpg',
			path.src.sprite + '**/*.jpeg'
		],
		gulp.series('image:sprite')
	);

	// svg sprite
	watch(
		[path.src.sprite + '*.svg'],
		gulp.series('image:svgsprite')
	);

	// svg sprite symbol mode
	watch(
		[path.src.sprite + 'symbol/**/*.svg'],
		gulp.series('image:svgspritesymbol', 'html:build')
	);

	doneCallback();
});

// open browser
gulp.task('browser', function(){
	return gulp.src(path.build.html + 'index.html')
		.pipe(open({uri: 'http://localhost:' + serverConfig.port}));
});


/* ********* */
/* Start All */
/* ********* */
gulp.task('default', gulp.series(
	'clean',
	gulp.parallel(
		'style:check',
		gulp.series(
			gulp.parallel(
				'image',
				'style:urgent',
				'style:build'
			),
			'html:build'
		),
		'fonts:build',
		'js:build'
	),
	'runserver',
	'watch',
	'browser'
));
