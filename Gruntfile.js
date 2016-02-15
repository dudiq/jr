'use strict';

/*
* options:
*
 `grunt build` - compile all src to `www` folder for phonegap build
 `grunt server` - run developer server
 `--build-type=dev(true, any other)` - use DEV configs for build, if flag not defined, used DEV as default config
 `--build-type=release` - use for PRODUCTION build configs 
 `--build-type=corporate` - use for CORPORATE build configs
 `--build-version=x.x.x` - use custom version value. if no need to use package.json:version field value
 `--minify=false` - for do not minify code
 `--rev-files=false` - for do not rename files as their revision. (windows build)
 `--config-mixin=my-config.js` - for define own my-config.js file for build, if value is not defined, it will use `dev-config.js`
 `--web=true` - for web server, NOT cordova version
 `--config-xml=my-config.xml` - for define special config xml
 `--copy-static=false` - copy www-static/* files to dist
 `--cordova-id` - set `id` value to config.xml
 `--port-reload` - set port and reload port for `grunt server` cmd

 `--exclude=module1,module2,etc...` - exclude modules for build
 `--excludeAll=true` - exclude all defined modules. flag `--exclude` will be dropped
*
*
* */

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    // load files from /tasks/* folder
    grunt.loadTasks('tasks');

    // for production
    var buildType = grunt.option("build-type");

    var copyStatic = (grunt.option("copy-static") !== false); // true by default

    var isWebVersion = grunt.option('web');

    var configMixin = grunt.option("config-mixin");

    var configXml = grunt.option("config-xml") || 'config.xml';


    var port = 9000;
    var reloadPort = 35729;

    var portReload = grunt.option('port-reload');
    if (portReload){
        var prePortReload = portReload.split(':');
        port = prePortReload[0];
        reloadPort = prePortReload[1];
    }

    grunt.initConfig({
        jrconfig: {
            // configurable paths
            app: 'app',
            dist: 'www',
            tmp: '.tmp'
        },
        notify: {
            postcss: {
                options: {
                    message: 'update finished'
                }
            },
            build: {
                options: {
                    message: 'build was completed'
                }
            }
        },
        watch: {
            compass: {
                files: ['<%= jrconfig.app %>/styles/{,**/}*.{scss,sass}'],
                tasks: ['compass:server', 'postcss', 'notify:postcss']
            },
            styles: {
                files: ['<%= jrconfig.app %>/styles/{,**/}*.css'],
                tasks: ['copy:styles', 'postcss']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: []
            }
        },
        postcss: {
            options: {
                processors: [
                    require('autoprefixer')({browsers: ['> 5%', 'last 2 versions']}) // add vendor prefixes
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= jrconfig.tmp %>/styles/',
                        src: '{,**/}*.css',
                        dest: '<%= jrconfig.tmp %>/styles/'
                    }
                ]
            }
        },
        connect: {
            options: {
                port: port,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: '0.0.0.0',
                livereload: reloadPort
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        '<%= jrconfig.tmp %>',
                        '<%= jrconfig.app %>'
                    ]
                }
            },
            dist: {
                options: {
                    base: '<%= jrconfig.dist %>'
                }
            }
        },
        clean: {
            def_configs: {
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
            cordova_js: {
                files: [
                    {
                        src: [
                            '<%= jrconfig.tmp %>/www/cordova.js'
                        ]
                    }
                ]
            },
            config_xml: {
                files:[
                    {
                        src: [
                            '<%= jrconfig.tmp %>/www/config.xml'
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
        compass: {
            options: {
                sassDir: '<%= jrconfig.app %>/styles',
                cssDir: '<%= jrconfig.tmp %>/styles',
                generatedImagesDir: '<%= jrconfig.tmp %>/images/generated',
                imagesDir: '<%= jrconfig.app %>/images',
                javascriptsDir: '<%= jrconfig.app %>/scripts',
                fontsDir: '<%= jrconfig.app %>/fonts',
                //importPath: '<%= jrconfig.app %>/bower_components',
                httpImagesPath: '/images',
                httpGeneratedImagesPath: '/images/generated',
                httpFontsPath: '/fonts',
                relativeAssets: false
            },
            dist: {},
            server: {
                options: {
                    debugInfo: true
                }
            }
        },
        copy: {
            www_static: {
                files: [
                    {
                        expand: true,
                        cwd: 'www-static',
                        dest: '<%= jrconfig.dist %>',
                        src: [
                            '**'
                        ]
                    }
                ]
            },

            config_xml: {
                src: '<%= jrconfig.app %>/' + configXml,
                dest: '<%= jrconfig.tmp %>/www/config.xml'
            },

            config_dist: {
                src: '<%= jrconfig.app %>/scripts/dist-config.js',
                dest: '<%= jrconfig.tmp %>/www/scripts/config.js'
            },
            config_dev: {
                src: '<%= jrconfig.app %>/scripts/dev-config.js',
                dest: '<%= jrconfig.tmp %>/www/scripts/config.js'
            },
            config_corp: {
                src: '<%= jrconfig.app %>/scripts/corp-config.js',
                dest: '<%= jrconfig.tmp %>/www/scripts/config.js'
            },
            config_mixin: {
                src: '<%= jrconfig.app %>/scripts/configs/' + configMixin,
                dest: '<%= jrconfig.tmp %>/www/scripts/config-mixin.js'
            },
            no_minify: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= jrconfig.app %>',
                        dest: '<%= jrconfig.dist %>',
                        src: [
                            'fonts/**',
                            'images/**'
                        ]

                    },
                    {
                        expand: true,
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
                cwd: '<%= jrconfig.app %>',
                dest: '<%= jrconfig.tmp %>/www/',
                src: [
                    '{,**/}**.js'
                ]
            },
            no_need_process_styles: {
                expand: true,
                cwd: '<%= jrconfig.app %>/styles',
                dest: '<%= jrconfig.tmp %>/styles/',
                src: '{,**/}**.css'
            },
            styles: {
                expand: true,
                cwd: '<%= jrconfig.tmp %>/styles/',
                dest: '<%= jrconfig.tmp %>/www/styles/',
                src: '{,**/}**.css'
            },
            images: {
                expand: true,
                cwd: '<%= jrconfig.app %>/images',
                dest: '<%= jrconfig.dist %>/images',
                src: '{,**/}**.{png,jpg,jpeg,gif,webp,svg}'
            },
            fonts: {
                expand: true,
                cwd: '<%= jrconfig.app %>/fonts',
                dest: '<%= jrconfig.dist %>/fonts',
                src: '**'
            },
            views: {
                expand: true,
                cwd: '<%= jrconfig.app %>/views',
                dest: '<%= jrconfig.tmp %>/www/views',
                src: '**'
            },
            root_tmp_files: {
                expand: true,
                dot: false,
                cwd: '<%= jrconfig.tmp %>/www',
                dest: '<%= jrconfig.dist %>',
                src: [
                    '*'
                ]
            },
            dist_files: {
                expand: true,
                dot: true,
                cwd: '<%= jrconfig.app %>',
                dest: '<%= jrconfig.tmp %>/www',
                src: [
                    '*.{ico,png,txt}',
                    'index.html',
                    '.htaccess'
                ]
            }


        },
        concat: {
            dist: {
                files: {} // will be redefined in minify task
            }
        },
        'replace-after-rev': {
            dist: {
                options: {
                    method: 'md5',
                    length: 8
                },
                folder: '<%= jrconfig.dist %>',
                files: [
                    {
                        where: 'styles/**',
                        list: ['fonts/**', 'images/**']
                    },
                        {
                        where: ['index.html', 'robots.txt'],
                        list: ['styles/**', 'scripts/**']
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
                replaceViews: {
                    what: '<%= jrconfig.tmp %>/www/scripts/core/templater-data.js',
                    where: '<%= jrconfig.tmp %>/www/views/'
                }
            }
        },
        insertversion:{
            dist: {
                src: '<%= jrconfig.tmp %>/www/scripts/plugins/build-version.js',
                parseXml: '<%= jrconfig.tmp %>/www/config.xml'
            }
        }
    });

    grunt.registerTask('server', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'compass:server',
            'copy:styles',
            'postcss',
            'connect:livereload',
            'watch'
        ]);
    });

    var defaultTasks = [
        // drop all
        'clean:dist',

        // prepare css
        'compass:dist',
        'copy:no_need_process_styles',
        'postcss', // compiled to <%= jrconfig.tmp %>/styles
        'copy:styles',

        // prepare others
        'copy:images',
        'copy:js',
        'copy:fonts',
        'copy:views',
        'copy:dist_files',
        'copy:config_xml',
        'clean:def_configs',
        'insertversion'
    ];

    grunt.registerTask('build', 'Default build', function () {
        runTasks.call(this, defaultTasks);
    });

    grunt.registerTask('default', [
        'build'
    ]);

    function defineCopyConfigs(tasks){
        // copy config.js to config.tmp
        var beforeTasks = [];

        var mainConfig = 'DEV';
        // prepare config.js as defined flags
        if (buildType == 'release') {
            beforeTasks.push('copy:config_dist');
            mainConfig = 'PROD';
        } else if (buildType == 'corporate'){
            beforeTasks.push('copy:config_corp');
            mainConfig = 'CORPORATE';
        } else {
            beforeTasks.push('copy:config_dev');
        }

        grunt.log.write('using ');
        grunt.log.write(mainConfig['yellow'].bold);
        grunt.log.writeln(' config');

        configMixin && beforeTasks.push('copy:config_mixin');

        // put them
        tasks.push.apply(tasks, beforeTasks);
    }

    function runTasks(tasks) {

        defineCopyConfigs(tasks);

        copyStatic && tasks.push('copy:www_static');

        // cleanup code for web version
        var cleanTask = isWebVersion ? 'clean:config_xml' : 'clean:cordova_js';
        tasks.push(cleanTask);

        tasks.push('minify');

        //last task
        tasks.push('notify:build');

        var outStr = 'tasks for run: ';

        for (var i = 0, l = tasks.length; i < l; i++){
            outStr += '\n ' + tasks[i];
        }

        grunt.log.writeln(outStr['yellow']);

        var done = this.async();

        // run all prepared tasks
        setTimeout(function(){
            done();
            grunt.task.run(tasks);
        }, 10);
    }
};
