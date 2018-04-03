module.exports = function (grunt) {

    grunt.registerMultiTask('iconsSplashes', 'icon,splash set to build', function () {

        if (!grunt.option('use-default-icons')){
            grunt.log.subhead(' > start set images for build');
            var corporateName = grunt.option('corporate');
            var prefix = grunt.option('image-set-prefix') || '';
            var corpPath = corporateName ? 'corporate/' + corporateName + '/' : '';



            var iconSet = {
                cmd: 'cordova-icon',
                args: ['--config=config.xml', '--icon=' + corpPath + 'image-set/' + prefix + 'icon.png']
            };
            var splashSet = {
                cmd: 'cordova-splash',
                args: ['--config=config.xml', '--splash=' + corpPath + 'image-set/' + prefix +'splash.png']
            };

            var done = this.async();

            execute({
                cmd: 'cordova',
                args: ['-v']
            }, function (error, result) {

                var ver = (result.stdout + '').split('.');
                var minor = ver[0];
                var major = ver[1];
                if (minor < 6){
                    // need add --xcode
                    iconSet.args.push('--xcode-old');
                    splashSet.args.push('--xcode-old');
                }
                execute(iconSet, function (error) {
                    if (error){
                        grunt.log.error('something wrong with `cordova-icon` running');
                        done();
                    } else {
                        execute(splashSet, function (error) {
                            if (error){
                                grunt.log.error('something wrong with `cordova-splash` running');
                            }
                            done();
                        })
                    }
                })
            });

        } else {
            grunt.log.subhead(' > image set will be default as it for used in IDE');
        }
    });

    function execute(setObj, done) {
        executerepotagging = grunt.util.spawn({
            cmd: setObj.cmd,
            args: setObj.args
        }, function (error, result, code) {
            done(error, result, code);
        });

        if (executerepotagging){
            executerepotagging.stdout.pipe(process.stdout);
            executerepotagging.stderr.pipe(process.stderr);
        }

    }

};
