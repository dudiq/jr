'use strict';

/*
* options:
*
 `grunt server` - run developer server
    `--port-reload=9000:35729` - set port:reloadPort for `grunt server` cmd
    `--hostname=0.0.0.0` - set host IP. if value is 0.0.0.0, this server will be accessed from outside


 `grunt build` - compile all src to `www` folder for phonegap build

     `--build-type=dev` - default value. for DEVELOPMENT. used `dev-config.js`
     `--build-type=release` - for PRODUCTION. used `dist-config.js`
     `--build-type=corporate` - for CORPORATE. used `corp-config.js`

     `--build-version=x.x.x` - for define custom version of app. instead `package.json:version` field value
     `--minify=false` - `true` by default. minify js, css files
     `--rev-files=false` - `true` by default. static asset revisioning through file content hash
     `--config-mixin=my-config.js` - for define own my-config.js file for build. keys and values from config-mixin will be used as primary.
     `--web=true` - `false` by default. make web app, NOT cordova version.
     `--config-xml=my-config.xml` - empty by default. for custom config.xml using
     `--copy-static=false` - `true` by default. copy from `www-static/**` to `www/`
     `--cordova-id=just.my.id` - set `id` value to config.xml. instead `package.json:cordova-id` field value

     `--exclude=module1,module2,etc...` - exclude modules for build
     `--excludeAll=true` - `false` by default. exclude all defined modules. flag `--exclude` will be dropped.


 `karma start` - run tests
 *
*
* */

module.exports = function (grunt) {
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    // load files from /tasks/* folder
    grunt.loadTasks('tasks');

    // for production
    var buildType = grunt.option("build-type");

    var copyStatic = (grunt.option("copy-static") !== false); // true by default

    var isWebVersion = grunt.option('web');

    var configMixin = grunt.option("config-mixin");
    var hostname = grunt.option("hostname") || '0.0.0.0';

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
                    message: 'update completed'
                }
            },
            build: {
                options: {
                    message: 'build completed'
                }
            }
        },
        watch: {
            sass: {
                files: ['<%= jrconfig.app %>/styles/**'],
                tasks: ['sass:server', 'postcss', 'notify:postcss']
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
                hostname: hostname,
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
        sass: {
            options: {
                sassDir: '<%= jrconfig.app %>/styles/',
                files: '**',
                outDir: '<%= jrconfig.tmp %>/styles/',
                libOptions: {}
            },
            dist: {},
            server: {}
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
                src: '<%= jrconfig.tmp %>/www/scripts/core-plugins/build-version.js',
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
            'sass:server',
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
        'sass:dist',
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
