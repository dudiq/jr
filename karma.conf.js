module.exports = function (karma) {

    var appExtend = require('./karma.extend');

    var karmaFiles = appExtend.getFiles();

    karma.set({

// base path, that will be used to resolve files and exclude
        basePath: './',

        frameworks: ['mocha'],

// list of files / patterns to load in the browser
        files: karmaFiles,


// list of files to exclude
        exclude: [
            'karma.conf.js'
        ],


// use dots reporter, as travis terminal does not support escaping sequences
// possible values: 'dots', 'progress', 'junit', 'teamcity', 'html'
// CLI --reporters progress
        reporters: ['progress', 'junit', 'coverage', 'html'],

        junitReporter: {
            // will be resolved to basePath (in the same way as files/exclude patterns)
            outputDir: 'reports/junit',
            outputFile: 'test-results.xml'
        },

        htmlReporter: {
            outputFile: 'reports/html/index.html'
        },

        preprocessors: {
            'app/**/*.js': 'coverage',
            '**/*.html': ['html2js']
        },

//Code Coverage options. report type available:
//- html (default)
//- lcov (lcov and html)
//- lcovonly
//- text (standard output)
//- text-summary (standard output)
//- cobertura (xml format supported by Jenkins)
        coverageReporter: {
            // cf. http://gotwarlost.github.com/istanbul/public/apidocs/
            type: 'html',
            dir: 'reports/coverage/'
        },


// web server port
        port: 9876,


// cli runner port
        runnerPort: 9100,


// enable / disable colors in the output (reporters and logs)
        colors: true,


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: karma.LOG_DEBUG,


// enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
// CLI --browsers Chrome,Firefox,Safari
//        browsers: ['PhantomJS'], //dont like chrome? try to use phantomJS
        browsers: ['Chrome'],
     

// If browser does not capture in given timeout [ms], kill it
        captureTimeout: 600000,


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
//        singleRun: true,
        singleRun: false,


        plugins: [
            'karma-mocha',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-phantomjs-launcher',
            'karma-html2js-preprocessor',
            'karma-junit-reporter',
            'karma-htmlfile-reporter',
            'karma-coverage'
        ]
    });
};