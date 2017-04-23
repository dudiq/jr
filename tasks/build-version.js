'use strict';

module.exports = function (grunt) {

    var toReplace = {
        changeset: "'',//{{version-changeset}}",
        date: "'',//{{version-date}}",
        major: '0,//{{version-major}}',
        minor: '0,//{{version-minor}}',
        build: '0,//{{version-build}}',
        branch: '0,//{{version-branch}}',
        revision: "''//{{version-revision}}"
    };

    var EXTEND_FILES_GETTER = /{{extend-file=([\w.\-\/]*)}}/g;
    var EXTEND_FILE_VAR_TEMPLATE = '{{extend-file=%s}}';

    function processLine(line){
        var pos = line.indexOf(":");
        var key = trim(line.substring(0, pos));
        var value = trim(line.substring(pos + 1));
        return {
            key: key,
            value: value
        };
    }

    function trim(str){
        return str.replace(/^\s+|\s+$/g, '');
    }


    function replaceData(filePath, obj){
        var file = grunt.file.read(filePath);

        var outStrDebug = "";
        for (var key in toReplace){
            var item = toReplace[key];
            var value = obj[key];
            if (key != 'revision'){
                value = value + ',';
            }
            outStrDebug += key + ":" + value + "\n";
            file = file.replace(item, value);
        }

        grunt.log.writeln(outStrDebug);
        grunt.file.write(filePath, file);
        grunt.log.ok('version changed');
    }

    function createExtendFileVar(filePath){
        var ret = EXTEND_FILE_VAR_TEMPLATE.replace('%s', filePath);
        return ret;
    }

    function replaceExtendFiles(file, filePaths, basePath){
        for (var i = 0, l = filePaths.length; i < l; i++) {
            var filePath = filePaths[i];
            var fullPath = basePath + filePath;

            var fileContent = grunt.file.read(fullPath);
            var placeholder = createExtendFileVar(filePath);
            file = file.replace(placeholder, fileContent);
        }
        return file;
    }

    function getExtendFilesPaths(fileContent){
        var ret = [];
        var match = EXTEND_FILES_GETTER.exec(fileContent);
        while (match) {
            var filePath = match[1];
            ret.push(filePath);
            match = EXTEND_FILES_GETTER.exec(fileContent);
        }
        return ret;
    }

    function replaceExtendFilesVars(file, extendFilesBasePath){
        var filePaths = getExtendFilesPaths(file);
        file = replaceExtendFiles(file, filePaths, extendFilesBasePath);
        return file;
    }

    function replaceStringVars(file, strings){
        for (var variable in strings) {
            var replacer = strings[variable];
            file = file.replace(variable, replacer);
        }
        return file;
    }

    function replaceXml(path, strings, extendFilesPath){
        if (grunt.file.exists(path)){
            var file = grunt.file.read(path);

            file = replaceStringVars(file, strings);
            file = replaceExtendFilesVars(file, extendFilesPath);

            grunt.file.write(path, file);
            grunt.log.ok('config.xml parsed, version changed');
        } else {
            grunt.log.error('cannot read config.xml for parse and change version');
        }
    }

    function getChangeSet(error, result, code, callback){
        var ch = {
            revision: "",
            branch: "",
            changeset: ""
        };
        if (!error){
            callback(result, ch);
        } else {
            grunt.log.error(code, result);
        }
        return ch;
    }

    function getChangeSetHg(result, ch){
        var lines = result.stdout.split("\n");
        var obj = {};
        for (var i = 0, l = lines.length; i < l; i++){
            var item = processLine(lines[i]);
            obj[item.key] = item.value;
        }

        ch.branch = obj.branch || 'default';

        if (obj.changeset){
            var revisionChangeset = obj.changeset.split(":");

            ch.revision = revisionChangeset[0];
            ch.changeset = revisionChangeset[1];
        } else {
            grunt.log.error('no changeset field');
        }
    }

    function getChangeSetGit(result, ch){
        var lines = result.stdout.split("\n");
        //:todo add branch showing
        for (var i = 0, l = lines.length; i < l; i++){
            var item = lines[i];
            if (item.indexOf('commit') == 0){
                var sets = item.split(" ");
                ch.changeset = sets[sets.length - 1];
                break;
            }
        }
    }

    function checkVersion(checkVal){
        try{
            var val = parseFloat(checkVal, 10);
            if (val != checkVal){
                checkVal = "'" + checkVal + "'";
            }
        } catch (e){
            checkVal = "'" + checkVal + "'";
        }
        return checkVal;
    }

    function parseResultsToObject(versions, filePath, ch){
        var changeset = ch.changeset;
        var revision = ch.revision;
        var branch = "'" + ch.branch + "'";
        grunt.log.ok('parsing result to object');
        var parseObj = {
            changeset: "'" + changeset + "'",
            date: (new Date).getTime(),
            major: checkVersion(versions[0]),
            minor: checkVersion(versions[1]),
            build: checkVersion(versions[2]),
            branch: branch,
            revision: "'" + revision + "'"
        };

        replaceData(filePath, parseObj);
    }

    grunt.registerMultiTask('insertVersion', 'Define build version in code', function () {

        grunt.log.subhead(' > start inserting version to build');

        var filePath = this.data.src;
        console.log(filePath);

        var pkg = grunt.file.readJSON('package.json');

        //allows to overwrite package.json version with custom grunt argument version
        var gruntVersionArgument = grunt.option('build-version');

        var currVer = gruntVersionArgument || pkg.appVersion;

        var versionsArray = (currVer + '').split('.');
        var versions = [];
        versions[0] = versionsArray[0];
        versions[1] = versionsArray[1];
        //team city has X.X.X.X version variant, so put 3rd ant 4th items into build
        versionsArray.splice(0, 2);
        versions[2] = versionsArray.join('.');

        grunt.log.writeln("current version of app: " + currVer);

        grunt.log.writeln("");
        if (this.data.inputXmlPath){
            var cordovaBlock = pkg.cordova || {};
            var version = versions.join(".");
            var cordovaId = grunt.option('cordova-id') || cordovaBlock.id || 'id.example.com';
            var appName = grunt.option('cordova-name') || pkg.name || 'exampleName';
            var publisherDisplayName = grunt.option('cordova-publisherDisplayName') || cordovaBlock.publisherDisplayName || 'examplePublisher';
            var description = grunt.option('cordova-description') ||cordovaBlock.description || 'description';
            var iosTeamId = grunt.option('cordova-iosTeamId') || cordovaBlock.iosTeamId || 'ios-team-id-here';
            var author = grunt.option('cordova-author') || cordovaBlock.author || 'author';

            var authorEmail = grunt.option('cordova-author-email') || cordovaBlock.authorEmail || 'example@example.example';
            var authorLink = grunt.option('cordova-author-link') || cordovaBlock.authorLink || '';
            var debugServerValue = cordovaBlock.debugServerValue || '';

            var androidVersionCode = (versions[0] * 100000 - 0) + (versions[1] * 1000 - 0) + (versions[2] - 0) + 108;
            var strings = {
                '{{appVersion}}': version,
                '{{cordova.id}}': cordovaId,
                '{{name}}': appName,
                '{{cordova.publisherDisplayName}}': publisherDisplayName,
                '{{cordova.description}}': description,
                '{{cordova.iosTeamId}}': iosTeamId,
                '{{cordova.author}}': author,
                '{{cordova.authorEmail}}': authorEmail,
                '{{cordova.authorLink}}': authorLink,
                '{{cordova.debugServerValue}}': debugServerValue,
                '{{versionCode}}': androidVersionCode
            };

            // process config.xml file to correct version
            replaceXml(this.data.inputXmlPath, strings, this.data.extendFilesPath);
        }

        var done = this.async();
        var executerepotagging;
        if (grunt.file.exists('.hg')){
            //run for .hg
            executerepotagging = grunt.util.spawn({
                cmd: "hg",
                args: ["log", "-l", "1", "-f"]
            }, function (error, result, code) {
                var ch = getChangeSet(error, result, code, getChangeSetHg);
                parseResultsToObject(versions, filePath, ch);
                done();
            });

        } else if (grunt.file.exists('.git')){
            // run for .git
            executerepotagging = grunt.util.spawn({
                cmd: "git",
                args: ["log", "-1"]
            }, function (error, result, code) {
                var ch = getChangeSet(error, result, code, getChangeSetGit);
                parseResultsToObject(versions, filePath, ch);
                done();
            });
        } else {
            grunt.log.error(".hg or .git not exist! app('build-version') will not work!");
            done();
        }

        if (executerepotagging){
            executerepotagging.stdout.pipe(process.stdout);
            executerepotagging.stderr.pipe(process.stderr);
        }

    });

};
