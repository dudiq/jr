'use strict';
/*
 * options:
 *
 `grunt server` - run developer server
 `--server-port=9000` - set port for `grunt server` cmd, where localhost will be opened `localhost:9000` for example
 `--hostname=0.0.0.0` - set host IP. if value is 0.0.0.0, this server will be accessed from outside


 `grunt build` - compile all src to `www` folder for phonegap build

 `--build-type=dev` - default value. for DEVELOPMENT. used `dev-config.js`
 `--build-type=release` - for PRODUCTION. used `dist-config.js`
 `--build-type=corporate` - for CORPORATE. used `corp-config.js`

 `--build-version=x.x.x` - for define custom version of app. instead `package.json:version` field value
 `--minify=false|general,topStyles,diag,utests,etc...` - `true` by default. minify js, css files. also can be used with list of modules to minify
 `--rev-files=false` - `true` by default. static asset revisioning through file content hash
 `--config-mixin=my-config.js` - for define own my-config.js file for build. keys and values from config-mixin will be used as primary.
 `--web=true` - `false` by default. make web app, NOT cordova version.
 `--config-xml=my-config.xml` - empty by default. for custom config.xml using
 `--copy-static=false` - `true` by default. copy from `www-static/**` to `www/`
 `--cordova-id=just.my.id` - set `id` value to config.xml. instead `package.json:cordova-id` field value

 `--include=module1,module5,etc...` - include modules
 `--exclude=module1,module2,etc...` - exclude modules for build
 `--excludeAll=true` - `false` by default. exclude all defined modules. flag `--exclude` will be dropped.

 *
 *
 * */

module.exports = function (grunt) {
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    // load files from /tasks/* folder
    grunt.loadTasks('tasks');

    var buildTypes = {
        dev: 'dev',
        release: 'release',
        corporate: 'corporate'
    };

    var BT_DEV = buildTypes.dev;
    var BT_CORPORATE = buildTypes.corporate;
    var BT_RELEASE = buildTypes.release;
    var PATH_APP = 'app';

    var buildType = grunt.option("build-type") || BT_DEV;
    if (grunt.option('release')) {
        // old keys support
        buildType = BT_RELEASE;
    }

    var corporateName = grunt.option('corporate');
    var corpPath = '';
    if (corporateName) {
        corpPath = 'corporate/' + corporateName + '/app/';
        grunt.log.write('using corporate "' + corporateName + '"');
        grunt.log.writeln(' ');
    }
    var usingCorp = !!corpPath;


    var ownConfig;
    if (grunt.option('config')) {
        //old keys
        ownConfig = grunt.option('config');
    }

    var copyStatic = (grunt.option("copy-static") !== false); // true by default

    var isWebVersion = grunt.option('web');

    var configMixinFile = grunt.option("config-mixin");
    var hostname = grunt.option("hostname") || '0.0.0.0';

    var configXml = grunt.option("config-xml") || 'config.xml';


    var port = 9000;

    var serverPortOption = grunt.option('server-port');
    if (serverPortOption) {
        port = serverPortOption;
    }

    function getPathForExtendVersion(configApp, corpPath) {
        var extendFilesByBuildType = {};
        extendFilesByBuildType[BT_DEV] = configApp + '/config-xml-extenders/dev/';
        extendFilesByBuildType[BT_RELEASE] = configApp + '/config-xml-extenders/release/';
        if (corpPath) {
            extendFilesByBuildType[BT_CORPORATE] = corpPath + 'config-xml-extenders/';
        } else {
            extendFilesByBuildType[BT_CORPORATE] = extendFilesByBuildType[BT_DEV];
        }
        var ret = extendFilesByBuildType[buildType];
        if (!ret) {
            // use dev by default
            ret = extendFilesByBuildType[BT_DEV];
        }
        return ret;
    }

    grunt.initConfig({
        jrconfig: {
            // configurable paths
            app: PATH_APP,
            corporate: corpPath,
            dist: 'www',
            tmp: '.tmp'
        },
        notify: {
            postcss: {
                options: {
                    message: 'css updated'
                }
            },
            build: {
                options: {
                    message: 'build completed'
                }
            },
            views: {
                options: {
                    message: 'views updated'
                }
            }
        },
        watch: {
            compileScss: {
                files: ['<%= jrconfig.app %>/{,**/}*.scss'],
                tasks: ['compileScss:server', 'postcss', 'notify:postcss']
            },
            styles: {
                files: ['<%= jrconfig.app %>/{,**/}*.css'],
                tasks: ['copy:compiledStyles', 'postcss']
            },
            views: {
                files: ['<%= jrconfig.app %>/{,**/}*.html'],
                tasks: ['updateViews', 'cssInRoot:dev', 'notify:views']
            }
        },
        updateViews: {
            dev: {
                options: {
                    from: '<%= jrconfig.app %>/scripts/core/templater-data.js',
                    to: '<%= jrconfig.tmp %>/scripts/core/templater-data.js',
                    replaceViews: {
                        whereReplace: '<%= jrconfig.tmp %>/scripts/core/templater-data.js',
                        prefix: '<%= jrconfig.app %>/',
                        viewsSrc: '<%= jrconfig.app %>/{,**/}*.html'
                    }
                }
            }
        },
        postcss: {
            options: {
                processors: [
                    require('autoprefixer')({browsers: ['> 2%', 'last 5 versions']}) // add vendor prefixes
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= jrconfig.tmp %>/',
                        src: '{,**/}*.css',
                        dest: '<%= jrconfig.tmp %>/'
                    }
                ]
            }
        },
        connect: {
            options: {
                port: port,
                hostname: hostname,
                livereload: false //reloadPort
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        '<%= jrconfig.tmp %>',
                        '<%= jrconfig.app %>'
                    ]
                }
            }
        },
        clean: {
            defaultConfigs: {
                files: [
                    {
                        src: [
                            '<%= jrconfig.dist %>/dev-config.js',
                            '<%= jrconfig.dist %>/dist-config.js',
                            '<%= jrconfig.dist %>/corp-config.js'
                        ]
                    }
                ]
            },
            cordovaJsFile: {
                files: [
                    {
                        src: [
                            '<%= jrconfig.tmp %>/www/cordova.js'
                        ]
                    }
                ]
            },
            dist: {
                files: [
                    {
                        dot: true,
                        src: [
                            '<%= jrconfig.tmp %>',
                            '<%= jrconfig.dist %>/*',
                            '!<%= jrconfig.dist %>/.git*'
                        ]
                    }
                ]
            },
            server: '<%= jrconfig.tmp %>'
        },
        compileScss: {
            options: {
                sassDir: ['<%= jrconfig.app %>/', corpPath ? corpPath + '/' : ''],
                files: '{,**/}**.scss',
                outDir: '<%= jrconfig.tmp %>/',
                libOptions: {}
            },
            dist: {},
            server: {
                files: '{,**/}**.scss'
            }
        },
        copy: {
            wwwStatic: {
                files: [
                    {
                        expand: true,
                        follow: true,
                        cwd: 'www-static',
                        dest: '<%= jrconfig.dist %>',
                        src: [
                            '**'
                        ]
                    }
                ]
            },
            cordovaJs: {
                src: '<%= jrconfig.app %>/cordova.js',
                dest: '<%= jrconfig.dist %>/cordova.js'
            },

            cordovaConfigXml: {
                src: '<%= jrconfig.app %>/' + configXml,
                dest: 'config.xml'
            },

            configDist: {
                src: '<%= jrconfig.app %>/scripts/' + (ownConfig ? ownConfig : 'dist-config.js'),
                dest: '<%= jrconfig.tmp %>/www/scripts/config.js'
            },
            configDev: {
                src: '<%= jrconfig.app %>/scripts/' + (ownConfig ? ownConfig : 'dev-config.js'),
                dest: '<%= jrconfig.tmp %>/www/scripts/config.js'
            },
            configCorporate: {
                src: '<%= jrconfig.app %>/scripts/' + (ownConfig ? ownConfig : 'corp-config.js'),
                dest: '<%= jrconfig.tmp %>/www/scripts/config.js'
            },
            mixinConfigFile: {
                src: '<%= jrconfig.app %>/scripts/configs/' + configMixinFile,
                dest: '<%= jrconfig.tmp %>/www/scripts/config-mixin.js'
            },
            corporate: {
                files: [
                    {
                        src: '<%= jrconfig.corporate %>/configs/config-mixin.js',
                        dest: '<%= jrconfig.tmp %>/www/scripts/config-mixin.js'
                    },
                    {
                        expand: true,
                        follow: true,
                        cwd: '<%= jrconfig.corporate %>',
                        dest: '<%= jrconfig.dist %>',
                        src: [
                            'images/**'
                        ]
                    },
                    {
                        expand: true,
                        follow: true,
                        cwd: '<%= jrconfig.corporate %>',
                        dest: '<%= jrconfig.tmp %>/www',
                        src: [
                            'scripts/**'
                        ]
                    },
                    {
                        expand: true,
                        follow: true,
                        cwd: '<%= jrconfig.corporate %>',
                        dest: '<%= jrconfig.tmp %>/www',
                        src: [
                            'scripts/{,**/}**.css',
                            'styles/{,**/}**.css'
                        ]
                    }
                ]
            },
            minifiedModules: {
                //filled in minify task
                files: []
            },
            withoutMinify: {
                // called from minify task
                files: [
                    {
                        expand: true,
                        follow: true,
                        cwd: '<%= jrconfig.app %>',
                        dest: '<%= jrconfig.dist %>',
                        src: [
                            'fonts/**',
                            'images/**'
                        ]

                    },
                    {
                        expand: true,
                        follow: true,
                        cwd: '<%= jrconfig.tmp %>/www',
                        dest: '<%= jrconfig.dist %>',
                        src: [
                            'scripts/**',
                            'styles/**'
                        ]

                    }
                ]
            },
            js: {
                expand: true,
                follow: true,
                cwd: '<%= jrconfig.app %>',
                dest: '<%= jrconfig.tmp %>/www/',
                src: [
                    '{,**/}**.js'
                ]
            },
            stylesOnlyCSS: {
                expand: true,
                follow: true,
                cwd: '<%= jrconfig.app %>/',
                dest: '<%= jrconfig.tmp %>/',
                src: '{,**/}**.css'
            },
            compiledStyles: {
                expand: true,
                follow: true,
                cwd: '<%= jrconfig.tmp %>/',
                dest: '<%= jrconfig.tmp %>/www/',
                src: '{,**/}**.css'
            },
            images: {
                expand: true,
                follow: true,
                cwd: '<%= jrconfig.app %>/images',
                dest: '<%= jrconfig.dist %>/images',
                src: '{,**/}**.{png,jpg,jpeg,gif,webp,svg}'
            },
            fonts: {
                expand: true,
                follow: true,
                cwd: '<%= jrconfig.app %>/fonts',
                dest: '<%= jrconfig.dist %>/fonts',
                src: '**'
            },
            views: {
                expand: true,
                follow: true,
                cwd: '<%= jrconfig.app %>/',
                dest: '<%= jrconfig.tmp %>/www/',
                src: [
                    'scripts/{,**/}*.html',
                    'views/{,**/}*.html',
                    'styles/{,**/}*.html'
                ]
            },
            rootFilesFromTmp: {
                expand: true,
                follow: true,
                dot: false,
                cwd: '<%= jrconfig.tmp %>/www',
                dest: '<%= jrconfig.dist %>',
                src: [
                    '*'
                ]
            },
            otherFiles: {
                expand: true,
                follow: true,
                dot: true,
                cwd: '<%= jrconfig.app %>',
                dest: '<%= jrconfig.tmp %>/www',
                src: [
                    '*.{ico,png,txt}',
                    '.htaccess'
                ]
            }
        },
        cssInRoot: {
            dev: {
                options: {
                    from: '<%= jrconfig.app %>/index.html',
                    to: '<%= jrconfig.tmp %>/index.html',
                    processor: function (data) {
                        var ret = data.split('.scss').join('.css');
                        return ret;
                    }
                }
            },
            dist: {
                options: {
                    from: '<%= jrconfig.app %>/index.html',
                    to: '<%= jrconfig.tmp %>/www/index.html',
                    processor: function (data) {
                        var ret = data.split('.scss').join('.css');
                        return ret;
                    }
                }
            }
        },
        concat: {
            dist: {
                files: {} // will be redefined in minify task
            }
        },
        replaceAfterRev: {
            dist: {
                options: {
                    method: 'md5',
                    length: 8
                },
                folder: '<%= jrconfig.dist %>',
                files: [
                    {
                        where: '{,**/}**.css',
                        list: ['fonts/**', 'images/**']
                    },
                    {
                        where: ['index.html', 'robots.txt'],
                        list: ['{,**/}**.css', '{,**/}**.js']
                    }
                ]
            }
        },
        cssmin: {
            dist: {
                files: {} // will be redefined in minify task
            }
        },
        uglify: {
            dist: {
                files: {} // will be redefined in minify task
            }
        },
        minify: {
            dist: {
                src: '<%= jrconfig.tmp %>/www',
                dest: '<%= jrconfig.dist %>',
                buildType: buildType,
                replaceViews: {
                    cleanSrc: true,
                    whereReplace: '<%= jrconfig.tmp %>/www/scripts/core/templater-data.js',
                    prefix: '<%= jrconfig.tmp %>/www/',
                    viewsSrc: '<%= jrconfig.tmp %>/www/{,**/}*.html'
                }
            }
        },
        insertVersion: {
            dist: {
                src: '<%= jrconfig.tmp %>/www/scripts/core-plugins/build-version.js',
                inputXmlPath: 'config.xml',
                extendFilesPath: getPathForExtendVersion(PATH_APP, corpPath)
            }
        },
        iconsSplashes: {
            dist: {}
        },
        htmlmin: {                                     // Task
            dist: {                                      // Target
                options: {                                 // Target options
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {                                   // Dictionary of files
                    '<%= jrconfig.dist %>/index.html': '<%= jrconfig.dist %>/index.html'     // 'destination': 'source'
                }
            }
        }
    });

    var serverTasks = [
        'compileScss:server',
        'copy:compiledStyles',
        'cssInRoot:dev',
        'updateViews:dev',
        'postcss'
    ];

    grunt.registerTask('purify', function () {
        grunt.task.run(['purifycss']);
    });

    grunt.registerTask('server', function (target) {
        var tasks = ['clean:server'];
        tasks.push.apply(tasks, serverTasks);
        tasks.push.apply(tasks, [
            'connect:livereload',
            'watch']);

        grunt.task.run(tasks);
    });

    var defaultTasksForBuild = [
        // drop all
        'clean:dist',

        // prepare css
        'compileScss:dist',
        'copy:stylesOnlyCSS',
        'postcss', // compiled to <%= jrconfig.tmp %>/styles
        'copy:compiledStyles',
        'cssInRoot:dist',

        // prepare others
        'copy:images',
        'copy:js',
        'copy:fonts',
        'copy:views',
        'copy:otherFiles',
        'copy:cordovaConfigXml',
        usingCorp ? 'copy:corporate' : null,
        'clean:defaultConfigs',
        'insertVersion'
    ];

    grunt.registerTask('build', 'Default build', function () {
        runTasks.call(this, defaultTasksForBuild);
    });

    grunt.registerTask('default', [
        'build'
    ]);

    function defineCopyConfigs(tasks) {
        // copy config.js to config.tmp
        var beforeTasks = [];

        var mainConfigTitle = 'DEV';
        // prepare config.js as defined flags
        if (buildType == BT_RELEASE) {
            beforeTasks.push('copy:configDist');
            mainConfigTitle = 'PROD';
        } else if (buildType == BT_CORPORATE) {
            beforeTasks.push('copy:configCorporate');
            mainConfigTitle = 'CORPORATE';
        } else {
            beforeTasks.push('copy:configDev');
        }

        grunt.log.write('using ');
        grunt.log.write(mainConfigTitle['yellow'].bold);
        grunt.log.writeln(' config');

        configMixinFile && beforeTasks.push('copy:mixinConfigFile');

        // put them
        tasks.push.apply(tasks, beforeTasks);
    }

    function runTasks(tasks) {

        defineCopyConfigs(tasks);

        copyStatic && tasks.push('copy:wwwStatic');

        // cleanup code for mobile version
        !isWebVersion && tasks.push('clean:cordovaJsFile');

        tasks.push('minify');

        //last task
        tasks.push('updateViews:dev');
        !isWebVersion && tasks.push('iconsSplashes');

        tasks.push('htmlmin');
        tasks.push('notify:build');

        tasks.push.apply(tasks, serverTasks); // when server started, need update all views, css, code, etc...

        for (var i = tasks.length - 1; i >= 0; i--) {
            if (!tasks[i]) {
                tasks.splice(i, 1);
            }
        }

        var outStr = 'tasks for run: \n';
        outStr += tasks.join('\n ');
        grunt.log.writeln(outStr['yellow']);

        var done = this.async();

        // run all prepared tasks
        setTimeout(function () {
            done();
            grunt.task.run(tasks);
        }, 10);
    }
};
