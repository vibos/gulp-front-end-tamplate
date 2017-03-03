# gulp-front-end-template
Front-end template for Gulp

## What it can do?
- LESS
- CSS autoprefixer
- CSS, JS, image minify
- Sprites (just put images in foders and get sprites with folders names)
- SVG sprites
- templates for asynchronous loading of CSS and JS (basic styles are minified and directly put into HTML)
- manually controll of sprite versions to prevent cache

## Getting Started
1. Copy source, lib, bower.json, package.json, gulpfile.js.
2. Run
	$ npm install
3. Run
	$ npm install node-notifier
4. Run 
	$ bower install
5. Start server - run 
	$ gulp
6. Open http://localhost:9999/

## Folders structure
```
├── bower.json					# bower config
├── package.json					# npm confg
├── gulpfile.js					# gulpfile
├── lib							# gulp library files
└── build							# Собранный проект
	├── css						# compiled CSS
	├── img						# images
		└── sprite				# sprites
	├── js						# merged JS
	├── minified					# compressed JS and CSS files
		├── css
		└── js
	└── index.html				# HTML index file
└── source						# source files
	├── css						# stylesheets
		├── generated				# generated by gulp CSS and LESS files for sprites
		├── partials				# partial LESS files
		├── urgent				# basic CSS, that is built in head of html document
		└── style.less			# main LESS file. Merge all LESS files here
	├── fonts						# fonts - do not process, just are copied to build/fonts
	└── img						# images
		├── common				# images to minify and put into build/img
		└── sprite				# images to build sprite (png, gif, jpg, jpeg -> png sprites (one icluded foledr - one sprite)
			|					# SVG files - svg sprite with png fallback (no included directories allowd)
			└── symbol			# SVG sprite in symbol mode
	├── js
		├── lib					# JS libraries
		├── partials				# JS files
		└── js.js					# main JS file. Here merge all files
	├── templates					# HTML templates
	└── index.html				# HTML index file
```
