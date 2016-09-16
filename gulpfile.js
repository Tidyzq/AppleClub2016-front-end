'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var del = require('del');
var merge = require('merge-stream');
var wiredep = require('wiredep').stream;
var _ = require('lodash');
var browserSync = require('browser-sync');
var browserSyncSpa = require('browser-sync-spa');
var $ = require('gulp-load-plugins')();

/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['clean'], function () {
  gulp.start('build');
});


/**
 *
 * Gulp configs
 *
 */

var conf = {};

conf.paths = {
    src: 'src',
    tmp: '.tmp',
    dist: 'dist',
    vendor: 'bower_components'
};

/**
 *  Wiredep is the lib which inject bower dependencies in your project
 *  Mainly used to inject script tags in the index.html but also used
 *  to inject css preprocessor deps and js files in karma
 */
conf.wiredep = {
    directory: 'bower_components'
};

/**
 *  Common implementation for an error handler of a Gulp plugin
 */
var errorHandler = function (title) {
    'use strict';

    return function (err) {
        gutil.log(gutil.colors.red('[' + title + ']'), err.toString());
        this.emit('end');
    };
};


var isOnlyChange = function (event) {
    return event.type === 'changed';
};

/**
 *
 * Gulp tasks
 *
 */

gulp.task('clean', function (cb) {
    return del([
        path.join(conf.paths.tmp, '/'),
        path.join(conf.paths.dist, '/')
    ], cb);
});

gulp.task('serve', ['watch'], function () {
    var baseDir = [conf.paths.tmp, conf.paths.src];
    var browser = 'default';

    var routes = {
        '/bower_components': 'bower_components'
    };

    var server = {
        baseDir: baseDir,
        routes : routes
    };

    /*
     * You can add a proxy to your backend by uncommenting the line below.
     * You just have to configure a context which will we redirected and the target url.
     * Example: $http.get('/users') requests will be automatically proxified.
     *
     * For more details and option, https://github.com/chimurai/http-proxy-middleware/blob/v0.9.0/README.md
     */
    // server.middleware = proxyMiddleware('/users', {target: 'http://jsonplaceholder.typicode.com', changeOrigin: true});

    browserSync.instance = browserSync.init({
        startPath: '/',
        server   : server,
        browser  : browser
    });
});

gulp.task('serve:dist', ['watch'], function () {
    var baseDir = [conf.paths.dist];
    var browser = 'default';

    var routes = {};

    var server = {
        baseDir: baseDir,
        routes : routes
    };

    /*
     * You can add a proxy to your backend by uncommenting the line below.
     * You just have to configure a context which will we redirected and the target url.
     * Example: $http.get('/users') requests will be automatically proxified.
     *
     * For more details and option, https://github.com/chimurai/http-proxy-middleware/blob/v0.9.0/README.md
     */
    // server.middleware = proxyMiddleware('/users', {target: 'http://jsonplaceholder.typicode.com', changeOrigin: true});

    browserSync.instance = browserSync.init({
        startPath: '/',
        server   : server,
        browser  : browser
    });
});

gulp.task('watch', ['inject'], function () {
  gulp.watch([
      path.join(conf.paths.src, '/*.jade'),
      'bower.json'
  ], function (event) {
      gulp.start('inject-reload');
  });

  // html and jade
  gulp.watch([
      path.join(conf.paths.src, '/**/*.jade'),
      path.join(conf.paths.src, '/**/*.html'),
      '!' + path.join(conf.paths.src, '/*.jade')
  ], function (event) {
      if (isOnlyChange(event)) {
          gulp.start('templates-reload');
      } else {
          gulp.start('inject-reload');
      }
  });

  // css and sass
  gulp.watch([
      path.join(conf.paths.src, '/**/*.css'),
      path.join(conf.paths.src, '/**/*.scss'),
      path.join(conf.paths.src, '/**/*.sass')
  ], function (event) {
      if (isOnlyChange(event)) {
          gulp.start('styles-reload');
      } else {
          gulp.start('inject-reload');
      }
  });

  // javascript and livescript
  gulp.watch([
      path.join(conf.paths.src, '/**/*.ls'),
      path.join(conf.paths.src, '/**/*.js')
  ], function (event) {
      if (isOnlyChange(event)) {
          gulp.start('scripts-reload');
      } else {
          gulp.start('inject-reload');
      }
  });
});

function buildInject() {
  var injectStyles = gulp.src([
            path.join(conf.paths.tmp, '/**/*.css')
        ]);

    var injectScripts = gulp.src([
            path.join(conf.paths.tmp, '/**/*.js')
        ]);

    var injectOptions = {
        ignorePath  : conf.paths.tmp,
        addRootSlash: false
    };

    return gulp.src(path.join(conf.paths.tmp, '/*.html'))
        .pipe($.inject(injectStyles, injectOptions))
        .pipe($.inject(injectScripts, injectOptions))
        .on('error', errorHandler('inject'))
        .pipe(wiredep(_.extend({
            ignorePath: '..'
        }, conf.wiredep)))
        .on('error', errorHandler('wiredep'))
        .pipe(gulp.dest(conf.paths.tmp));
}

gulp.task('inject-reload', ['scripts', 'templates', 'styles'], function () {
    return buildInject()
      .pipe(browserSync.stream());
});

gulp.task('inject', ['scripts', 'templates', 'styles'], function () {
    return buildInject();
});

function copyJavascripts() {
  return gulp.src([
    path.join(conf.paths.src, '/**/*.js')
  ])
    .pipe(gulp.dest(conf.paths.tmp));
}

function buildLivescripts() {
  return gulp.src([
    path.join(conf.paths.src, '/**/*.ls')
  ])
    .pipe($.livescript({bare: true}))
    .on('error', errorHandler('livescript'))
    .pipe(gulp.dest(conf.paths.tmp));
}

function buildScripts() {
  var _js = copyJavascripts(),
      _ls = buildLivescripts();

  return merge(_js, _ls);
}

gulp.task('scripts-reload', function() {
  return buildScripts()
    .pipe(browserSync.stream());
});

gulp.task('scripts', function() {
  return buildScripts();
});

function copyCss() {
  return gulp.src([
    path.join(conf.paths.src, '/**/*.css')
  ])
    .pipe(gulp.dest(conf.paths.tmp));
}

function buildSass() {
  return gulp.src([
    path.join(conf.paths.src, '/**/*.scss'),
    path.join(conf.paths.src, '/**/*.sass')
  ])
    .pipe($.sass())
    .on('error', errorHandler('sass'))
    .pipe(gulp.dest(conf.paths.tmp));
}

function buildStyles() {
  var _css = copyCss(),
      _sass = buildSass();

  return merge(_css, _sass);
}

gulp.task('styles-reload', function() {
  return buildStyles()
    .pipe(browserSync.stream());
});

gulp.task('styles', function () {
  return buildStyles();
});

function copyHtml() {
  return gulp.src([
    path.join(conf.paths.src, '/**/*.html')
  ])
    .pipe(gulp.dest(conf.paths.tmp));
}

function buildJade() {
  return gulp.src(path.join(conf.paths.src, '/**/*.jade'))
    .pipe($.jade({ pretty: true }))
    .on('error', errorHandler('jade'))
    .pipe(gulp.dest(conf.paths.tmp));
}

function buildTemplates() {
  var _html = copyHtml(),
      _jade = buildJade();
  return merge(_html, _jade);
}

gulp.task('templates-reload', function() {
  return buildTemplates()
    .pipe(browserSync.stream());
});

gulp.task('templates', function() {
  return buildTemplates();
});

gulp.task('build', ['build:html', 'build:assets']);

gulp.task('build:html', ['inject'], function() {
  var cssFilter = $.filter('**/*.css', { restore: true });
  var jsFilter = $.filter('**/*.js', { restore: true });
  var htmlFilter = $.filter('**/*html', { restore: true });

  return gulp.src(path.join(conf.paths.tmp, '/*.html'))
    .pipe($.useref({
      searchPath: [
        conf.paths.tmp,
        './'
      ]
    }))
    // .pipe($.rename(function (filePath) {
    //   filePath.dirname = filePath.dirname.replace('console/', '');
    // }))
    .pipe(jsFilter)
    .pipe($.uglify()).on('error', errorHandler('Uglify'))
    .pipe($.rev())
    .pipe(jsFilter.restore)

    .pipe(cssFilter)
    // .pipe($.modifyCssUrls({
    //   modify: function (url, filePath) {
    //     return path.join('../fonts/', path.basename(url));
    //   }
    // }))
    .pipe($.cssnano())
    .pipe($.rev())
    .pipe(cssFilter.restore)
    .pipe($.revReplace())

    .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
    .pipe($.size({
        title    : path.join(conf.paths.dist, '/'),
        showFiles: true
    }));
});

gulp.task('build:assets', function () {
  return gulp.src(
      path.join(conf.paths.src, 'assets/{fonts,images}/**/*.*')
    )
    // .pipe($.print())
    .pipe(gulp.dest(path.join(conf.paths.dist, 'assets/')));
});
