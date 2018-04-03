/*
* */
(function (app) {
    var appLogger = app('logger');
    var logger = appLogger('cordova-file');
    var utils = app('cordova-file-utils');
    logger.logLevel(appLogger.LEVEL_PROD);

    var errorCodes = {
        OK: 0,

        NOT_FOUND_ERR: 1,
        SECURITY_ERR: 2,
        ABORT_ERR: 3,
        NOT_READABLE_ERR: 4,
        ENCODING_ERR: 5,
        NO_MODIFICATION_ALLOWED_ERR: 6,
        INVALID_STATE_ERR: 7,
        SYNTAX_ERR: 8,
        INVALID_MODIFICATION_ERR: 9,
        QUOTA_EXCEEDED_ERR: 10,
        TYPE_MISMATCH_ERR: 11,
        PATH_EXISTS_ERR: 12,

        UNKNOWN_ERROR: 99
    };

    // processing fail
    function onFail(onComplete, evt, identifier) {
        var code = evt ? evt.code : errorCodes.UNKNOWN_ERROR;
        onComplete && onComplete(code, evt);
    }

    function processExistOnFail(evt, onComplete) {
        var code = evt ? evt.code : errorCodes.UNKNOWN_ERROR;
        if (code == errorCodes.NOT_FOUND_ERR) {
            code = errorCodes.OK;
        }

        onComplete && onComplete(code, false);
    }

    function makeFileReader(onComplete, onFail) {
        var reader = new FileReader();
        reader.onerror = onFail;
        reader.onabort = onFail;
        reader.onloadend = onComplete;
        return reader;
    }

    function processFolder(path, newPath, onComplete, method) {
        var pathArr = newPath.split('/');
        var dirName = pathArr.pop();
        var parentPath = pathArr.join('/');
        pathArr = null;
        utils.getDirectoryEntry(path, {
            onFail: function (evt) {
                onFail(onComplete, evt, 'doFolderToFolder.getDirectoryEntry:oldPath');
            },
            onDone: function (dir) {
                utils.getDirectoryEntry(parentPath, {
                    onFail: function (evt) {
                        onFail(onComplete, evt, 'doFolderToFolder.getDirectoryEntry:parentPath');
                    },
                    onDone: function (newDir) {
                        dir[method](newDir, dirName, function (dir) {
                            onComplete && onComplete(errorCodes.OK, dir);
                        }, function (evt) {
                            onFail(onComplete, evt, 'doFolderToFolder.' + method);
                        });
                    }
                });
            }
        });
    }

    function doFileToFolder(fromPath, toPath, newFileName, onComplete, methodName) {
        utils.getFileSystem({
            path: fromPath,
            fsGet: 'getFile',
            onFail: function (evt) {
                onFail(onComplete, evt, methodName + '.resolvePath');
            },
            onDone: function (file) {
                utils.getDirectoryEntry(toPath, {
                    onFail: function (evt) {
                        onFail(onComplete, evt, methodName + '.getFolder');
                    },
                    onDone: function (dir) {
                        file[methodName](dir, newFileName, function (fileEntry) {
                            onComplete && onComplete(errorCodes.OK, fileEntry);
                        }, function (evtMove) {
                            onFail(onComplete, evtMove, methodName + '.copying');
                        });
                    }
                });
            }
        });
    }

    // :todo add benchmarks for read/write
    app('cordova-file', {
        readTextFile: function getFile(path, onComplete) {
            if (typeof path == "object") {
                var reader = makeFileReader(function (evt) {
                    onComplete && onComplete(errorCodes.OK, evt.target.result);
                }, function (evt) {
                    onFail(onComplete, evt, 'readTextFile');
                });
                reader.readAsText(path);
            } else {
                utils.getFileSystem({
                    path: path,
                    fsGet: 'getFile',
                    fileEntry: 'file',
                    onFail: function (evt) {
                        onFail(onComplete, evt, 'read');
                    },
                    onDone: function (file) {
                        var reader = makeFileReader(function (evt) {
                            onComplete && onComplete(errorCodes.OK, evt.target.result);
                        }, function (evt) {
                            onFail(onComplete, evt, 'readTextFile');
                        });
                        reader.readAsText(file);
                        reader = null;
                    }
                });
            }
        },
        readDataFile: function (path, onComplete) {
            if (typeof path == "object") {
                var reader = makeFileReader(function (evt) {
                    onComplete && onComplete(errorCodes.OK, evt.target.result);
                }, function (evt) {
                    onFail(onComplete, evt, 'readDataFile');
                });
                reader.readAsDataURL(path);
            } else {
                utils.getFileSystem({
                    path: path,
                    fsGet: 'getFile',
                    fileEntry: 'file',
                    onFail: function (evt) {
                        onFail(onComplete, evt, 'read');
                    },
                    onDone: function (file) {
                        var reader = makeFileReader(function (evt) {
                            onComplete && onComplete(errorCodes.OK, evt.target.result);
                        }, function (evt) {
                            onFail(onComplete, evt, 'readDataFile');
                        });
                        reader.readAsDataURL(file);
                        reader = null;
                    }
                });
            }
        },
        writeFile: function (path, data, onComplete) {
            utils.getFileSystem({
                path: path,
                fsGet: 'getFile',
                fsParams: {create: true, exclusive: false},
                fileEntry: 'createWriter',
                onFail: function (evt) {
                    onFail(onComplete, evt, 'write');
                },
                onDone: function (writer) {
                    writer.onwriteend = function (evt) {
                        onComplete && onComplete(errorCodes.OK, evt.target.result);
                    };
                    writer.onerror = function (evt) {
                        onFail(onComplete, evt, 'write');
                    };
                    writer.onabort = function (evt) {
                        onFail(onComplete, evt, 'write');
                    };

                    writer.write(data);
                    writer = null;
                }
            });

        },
        removeFile: function (path, onComplete) {
            utils.getFileSystem({
                path: path,
                fsGet: 'getFile',
                fsParams: {create: false, exclusive: false},
                fileEntry: 'remove',
                onFail: function (evt) {
                    onFail(onComplete, evt, 'remove');
                },
                onDone: function (file) {
                    onComplete && onComplete(errorCodes.OK, file);
                }
            });
        },
        downloadFile: function (params) {
            var toPath = utils.getFilePath(params.toPath);
            var onComplete = params.onComplete;

            var fileTransfer = new FileTransfer();

            params.onProgress && (fileTransfer.onprogress = params.onProgress);

            if (params.abort) {
                params.abort = function () {
                    fileTransfer.abort();
                };
            }

            fileTransfer.download(
                params.fromUrl,
                toPath,
                function (entry) {
                    onComplete && onComplete(errorCodes.OK, entry);
                },
                function (evt) {
                    onFail(onComplete, evt, 'download');
                }
            );
            return fileTransfer;
        },
        getMeta: function (path, onComplete) {
            if (path.file) {
                var fileEntry = path;
                utils.processMeta(fileEntry, onComplete);
            } else {
                utils.getFileSystem({
                    path: path,
                    fsGet: 'getFile',
                    onFail: function (evt) {
                        onFail(onComplete, evt, 'getMeta');
                    },
                    onDone: function (fileEntry) {
                        utils.processMeta(fileEntry, onComplete);
                    }
                });
            }
        },
        copyTo: function (fromPath, toPath, newFileName, onComplete) {
            doFileToFolder(fromPath, toPath, newFileName, onComplete, 'copyTo');
        },
        moveTo: function (fromPath, toPath, newFileName, onComplete) {
            doFileToFolder(fromPath, toPath, newFileName, onComplete, 'moveTo');
        },
        upload: function (serverUrl, fullPath, params, onComplete) {
            params = params || {};
            var uri = encodeURI(serverUrl);
            var uploadPath = utils.getFilePath(fullPath);

            var resendCounter = params.resend;
            var options = new FileUploadOptions();
            options.fileKey = "file";

            options.fileName = params.fileName;
            options.mimeType = params.mimeType;
            options.headers = params.headers;

            var ft = new FileTransfer();
            params.fileTransfer = ft;
            var onProgress = params.onProgress;
            ft.onprogress = function (progressEvent) {
                var total = 0;
                var loaded = 0;
                if (progressEvent.lengthComputable) {
                    total = progressEvent.total;
                    loaded = progressEvent.loaded;
                } else {
                    loaded++;
                }
                onProgress && onProgress(total, loaded);
            };

            function done(ev) {
                onComplete && onComplete(errorCodes.OK, ev);
            }

            function fail(evt) {
                if (resendCounter && resendCounter > 0) {
                    resendCounter--;
                    // create new request
                    ft.upload(uploadPath, uri, done, fail, options);
                } else {
                    onFail(onComplete, evt, 'upload');
                }
            }

            ft.upload(uploadPath, uri, done, fail, options);
        },

        /// folders
        getFolderEntity: function (path, onComplete) {
            utils.getDirectoryEntry(path, {
                onFail: function (evt) {
                    onFail(onComplete, evt, 'getFolder');
                },
                onDone: function (dir) {
                    onComplete && onComplete(errorCodes.OK, dir);
                }
            }, false);
        },

        createFolder: function (path, onComplete) {
            // success
            utils.getDirectoryEntry(path, {
                onFail: function (evt) {
                    logger.log(" ++ create folder: fail = " + path);
                    onFail(onComplete, evt, 'folder');
                },
                onDone: function (dir) {
                    logger.log(" ++ create folder: done = " + path);
                    onComplete && onComplete(errorCodes.OK, dir);
                }
            });
        },
        removeFolder: function (path, onComplete) {
            utils.getDirectoryEntry(path, {
                onFail: function (evt) {
                    onFail(onComplete, evt, 'folder');
                },
                onDone: function (dir) {
                    dir.removeRecursively(function (dir) {
                        onComplete && onComplete(errorCodes.OK, dir);
                    }, function (evt) {
                        onFail(onComplete, evt, 'folder');
                    });
                }
            });
        },
        getFolderList: function (path, onComplete) {
            utils.getDirectoryEntry(path, {
                onFail: function (evt) {
                    onFail(onComplete, evt, 'getFolderList');
                },
                onDone: function (dir) {
                    var directoryReader = dir.createReader();
                    directoryReader.readEntries(function (entries) {
                        onComplete && onComplete(errorCodes.OK, entries);
                    }, function (evt) {
                        onFail(onComplete, evt, 'getFolderList');
                    });

                }
            });
        },
        copyFolder: function (path, newPath, onComplete) {
            processFolder(path, newPath, onComplete, 'copyTo');
        },
        moveFolder: function (path, newPath, onComplete) {
            processFolder(path, newPath, onComplete, 'moveTo');
        },
        checkFolderExist: function (path, onComplete) {
            utils.getFileSystem({
                path: path,
                fsGet: 'getDirectory',
                fsParams: {create: false, exclusive: false},
                onFail: function (evt) {
                    processExistOnFail(evt, onComplete);
                },
                onDone: function (dir) {
                    onComplete && onComplete(errorCodes.OK, dir);
                }
            });
        },
        checkExist: function (path, onComplete) {
            utils.getFileSystem({
                path: path,
                fsGet: 'getFile',
                fsParams: {create: false},
                fileEntry: 'file',
                onFail: function (evt) {
                    processExistOnFail(evt, onComplete);
                },
                onDone: function (file) {
                    onComplete && onComplete(errorCodes.OK, file);
                }
            });
        }

    });

})(window.app);
