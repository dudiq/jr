(function (app) {
    var deviceOs = app('device-os');
    var helper = app('helper');

    var CONST_CDVPATH;
    if (deviceOs.os() == deviceOs.TYPE_WINDOWS) {
        CONST_CDVPATH = 'ms-appdata:///local/';
    } else {
        CONST_CDVPATH = 'cdvfile://localhost/persistent/';
    }

    function onFsGet(fileSystem, params) {
        var fsGet = params.fsGet;
        fileSystem[fsGet](params.path, params.fsParams, function (fileEntry) {
            if (fsGet == 'getFile') {
                var nativeUrl = fileEntry.toURL();
                if (params.fileEntry) {
                    fileEntry[params.fileEntry](function (file) {
                        params.onDone(file, nativeUrl);
                    }, params.onFail);
                } else {
                    params.onDone(fileEntry, nativeUrl);
                }
            } else {
                // for others just call done
                // create folder, remove entry
                params.onDone(fileEntry);
            }
        }, params.onFail);
    }


    // link to file system root
    var fsLink;

    // return file system handler

    var utils = app('cordova-file-utils', {
        getAppStorageDir: function () {
            return cordova.file.applicationStorageDirectory;
        },
        getSharedDocumentsDir: function () {
            var file = helper.isNative ? cordova.file : {};
            var folder = file.documentsDirectory || file.externalRootDirectory || '';
            return folder;
        },
        getFilePath: function (path) {
            // :todo add processing path, if already have CONST_CDVPATH or something else path
            var ret = path;
            if (path.indexOf('://') == -1) {
                if (path[0] == '/') {
                    path = path.substr(1);
                }
                ret = CONST_CDVPATH + path;
            }
            return ret;
        },
        processMeta: function (fileEntry, onComplete) {
            // var nativeUrl = fileEntry.toURL();
            fileEntry.file(function (data) {
                //data.nativeUrl = nativeUrl;
                onComplete(false, 0, data);
            }, function (code, data) {
                onComplete(true, code, data);
            });
        },

        getFileSystem: function (params) {
            var path = params.path;
            if (path.indexOf(':') != -1) {
                var pathArr = path.split('/');
                var dirName = pathArr.pop();
                if (!dirName) {
                    dirName = pathArr.pop();
                }
                var parentPath = pathArr.join('/') + '/';
                params.path = dirName;
                window.resolveLocalFileSystemURL(parentPath, function (pDir) {
                    onFsGet(pDir, params);
                }, params.onFail);
            } else {
                if (!fsLink) {
                    if (window.LocalFileSystem) {
                        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                            fsLink = fileSystem.root;
                            onFsGet(fsLink, params);
                        }, params.onFail);
                    } else {
                        params.onFail();
                    }
                } else {
                    onFsGet(fsLink, params);
                }
            }
        },
        getDirectoryEntry: function (path, params, doCreate) {
            var onFail = params.onFail;
            var onDone = params.onDone;

            doCreate = (doCreate !== false); // true by default

            utils.getFileSystem({
                path: path,
                fsGet: 'getDirectory',
                fsParams: {create: doCreate, exclusive: false},
                onFail: function (evt) {
                    onFail && onFail(evt);
                },
                onDone: function (dir) {
                    onDone && onDone(dir);
                }
            });
        }

    });
})(window.app);
