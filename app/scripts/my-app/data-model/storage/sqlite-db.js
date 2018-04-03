(function (app) {
    var helper = app('helper');
    var logger = app('logger')('sqlite');
    var cordovaDevice = app('cordova-device');
    var promise = app('promise');
    var sqPlugin;
    var SQLiteAsPlugin = false;

    var codes = {
        CODE_ERROR: 10,
        CODE_OK: 0,
        CODE_EMPTY_QUERY: 404,
        CODE_NOT_DEFINED: 8098
    };

    helper.defineFieldsPrefix('sqlite.', codes);

    var DEFAULT_LIMIT = 6000;

    var quesMap = {};

    function initNativeDb(name, cb) {
        var db = this._db = sqPlugin.openDatabase({
            name: name,
            location: this._params.location || 'default'
        });
        this.useDirectExecute = !!db.executeSql;
        this.useNativeBatch = !!db.sqlBatch;
        cb(false);
    }

    var SqliteDbClass = helper.createClass({
        classConstructor: function (name, params) {
            this._name = name;
            this._params = params || {};
            this._db = null;
        },
        initDb: function (cb) {
            var self = this;
            cordovaDevice.onReady(function () {
                var name = self._name;
                if (SQLiteAsPlugin) {
                    setTimeout(function () {
                        initNativeDb.call(self, name, cb);
                    }, 1000);
                } else {
                    if (typeof openDatabase !== "undefined") {
                        self._db = openDatabase(name, '0.1', 'desc', 10 * 1024 * 1024);
                    }
                    logger.warn('window.sqlitePlugin is not defined');
                    cb();
                }
            });
        },
        closeDb: function (cb) {
            if (this._db) {
                this._db.close(function () {
                    logger.log('db is closed');
                    cb(false);
                }, function (e) {
                    logger.error('close error db');
                    cb(true,e);
                });
            }
        },
        dropTable: function (tableList) {
            var holder = promise();
            var toExec = [];
            if (!helper.isArray(tableList)) {
                tableList = [tableList];
            }
            helper.arrayWalk(tableList, function (item) {
                var execSql = 'DROP TABLE ' + item;
                toExec.push(execSql);
            });
            beforeBatch.call(this, toExec, holder.resultWait());
            return holder;
        },
        createTables: function (scheme) {
            var holder = promise();
            // create list for exec commands to batching
            var toExec = [];
            if (!helper.isArray(scheme)) {
                scheme = [scheme];
            }
            helper.arrayWalk(scheme, function (tableStructure) {
                var tableName = tableStructure.name;

                // toExec.push('drop table if EXISTS ' + tableName);

                var fieldNames = [];
                helper.arrayWalk(tableStructure.fields, function (field) {
                    var fieldName = field.name;
                    fieldNames.push(fieldName);
                });

                var fieldsStr = fieldNames.join(',');
                var execSql = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + fieldsStr + ')';
                toExec.push(execSql);

                if (tableStructure.indexOn) {
                    var indexField = tableStructure.indexOn;
                    var indexSql = 'CREATE INDEX IF NOT EXISTS index_' + indexField + ' ON ' + tableName + '(' + indexField + ')';
                    toExec.push(indexSql);
                }
            });

            beforeBatch.call(this, toExec, holder.resultWait());
            return holder;
        },
        createRecord: function (tableName, fields, values) {
            var holder = promise();
            if (!helper.isArray(fields)) {
                // preprocess data by object, not for arrays
                var obj = fields;
                fields = [];
                values = [];
                for (var key in obj) {
                    fields.push(key);
                    values.push(obj[key]);
                }
            }
            if (values.length) {
                if (fields.indexOf('id') == -1) {
                    insertId(fields, values);
                }

                var execSql = getInsertQuery(tableName, fields, values);
                if (this.useDirectExecute) {
                    this._db.executeSql(execSql, values, function (transaction) {
                        holder.resolve();
                    }, function (error) {
                        holder.reject(codes.CODE_ERROR, error);
                    });
                } else {
                    doTransaction.call(this, function (tx) {
                        tx.executeSql(execSql, values);
                    }, holder.resultWait());
                }
            } else {
                holder.reject(codes.CODE_EMPTY_QUERY);
            }
            return holder;
        },
        createRecords: function (tableName, schemeFields, data) {
            var holder = promise();
            logger.log('prepare data for insert');
            var canInsertId = (schemeFields.indexOf('id') == -1);
            if (data.length && canInsertId) {
                insertId(schemeFields);
            }
            var toExec = [];
            var execStr;
            var values;

            for (var i = 0, l = data.length; i < l; i++) {
                values = data[i];
                canInsertId && insertId(null, values);
                var insertQuery = getInsertQuery(tableName, schemeFields, values);
                execStr = [insertQuery, values];
                toExec.push(execStr);
            }
            toExec.length && logger.log('start inserting data; createRecords');
            beforeBatch.call(this, toExec, holder.resultWait());
            return holder;
        },
        getRecords: function (params) {
            var holder = promise();
            var onComplete = holder.resultWait();

            params = params || {};

            var tableName = params.tableName;
            var whatSelect = params.whatSelect;
            var whereExpr = params.whereExpr;
            var whereVals = params.whereVals;
            var orderBy = params.orderBy;
            var onItem = params.onItem;

            doTransaction.call(this, function (tx) {
                var query = 'SELECT ' + whatSelect + ' FROM ' + tableName;
                if (whereExpr) {
                    query += ' WHERE ' + whereExpr;
                }

                if (orderBy) {
                    query += ' ' + orderBy;
                }

                logger.log('getRecords:', query, whereVals);
                getDataQuery({
                    limit: params.limit,
                    tx: tx,
                    query: query,
                    whereVals: whereVals,
                    fromPos: params.fromPos,
                    useLimits: params.useLimits,
                    onComplete: onComplete,
                    onItem: onItem
                });
            }, onComplete);

            return holder;
        },
        updateRecord: function (tableName, whereExpr, whereVals, toUpdate) {
            var holder = promise();
            var onComplete = holder.resultWait();
            var toUpdateKeys = [];
            var toUpdateValues = [];
            for (var key in toUpdate) {
                toUpdateValues.push([toUpdate[key]]);
                toUpdateKeys.push(key);
            }
            helper.push(toUpdateValues, whereVals);

            doTransaction.call(this, function (tx) {
                var query = 'UPDATE ' + tableName + ' SET ' + (toUpdateKeys.join(' = ?, ') + ' = ? ');
                if (whereExpr) {
                    query += ' WHERE ' + whereExpr;
                }

                logger.log('updateRecord:', query, whereVals);
                getDataQuery({
                    tx: tx,
                    query: query,
                    whereVals: toUpdateValues,
                    useLimits: false,
                    onComplete: onComplete
                });
            }, onComplete);

            return holder;
        },
        updateRecords: function () {
            // :todo
        },
        removeRecords: function (tableName, whereExpr, whereVals) {
            var holder = promise();
            // :todo need rethink about this way
            removeRecords.call(this, tableName, whereExpr, whereVals, holder.resultWait());
            return holder;
        },
        exec: function (execSql, values) {
            var holder = promise();
            var onComplete = holder.resultWait();
            doTransaction.call(this, function (tx) {
                tx.executeSql(execSql, values, function () {
                    holder.resolve.apply(holder, arguments);
                }, function (error) {
                    holder.reject(codes.CODE_ERROR, error);
                });
            }, onComplete);
            return holder;
        }
    });

    function insertId(fields, values) {
        if (values.length) {
            fields && fields.splice(0, 0, 'id');
            values && values.splice(0, 0, helper.mongoId());
        }
    }

    function getInsertQuery(tableName, schemeFields, values) {
        var valLen = values.length;
        var quesVal = quesMap[valLen];
        if (!quesVal) {
            // create new
            quesVal = createQuesVal(valLen);
        }
        var setFields = schemeFields.join(',');
        var ret = 'insert into ' + tableName + ' (' + setFields + ') values (' + quesVal + ')';
        return ret;
    }

    function createQuesVal(length) {
        var list = [];
        for (var i = 0; i < length; i++) {
            list.push('?');
        }
        var res = list.join(',');
        quesMap[length] = res;
        return res;
    }

    function removeRecords(tableName, whereExpr, whereVals, onComplete) {
        var query = 'DELETE FROM ' + tableName;
        if (whereExpr) {
            query += ' WHERE ' + whereExpr;
        }

        logger.log('removeRecords:', query, whereVals);

        doTransaction.call(this, function (tx) {
            tx.executeSql(query, whereVals);
        }, onComplete);
    }

    function doTransaction(onTransaction, onComplete) {
        var db = this._db;
        if (db) {
            if (this.useDirectExecute) {
                // do not use transaction
                onTransaction(db);
            } else {
                db.transaction(function (tx) {
                    onTransaction(tx);
                }, function (error) {
                    logger.error('Transaction ERROR: ' + error.message);
                    onComplete(codes.CODE_ERROR, error);
                }, function () {
                    logger.log('Transaction OK');
                    onComplete(codes.CODE_OK);
                });
            }
        } else {
            logger.error('doTransaction', 'db is not defined');
            onComplete(codes.CODE_NOT_DEFINED);
        }
    }

    function getDataQuery(params) {
        var tx = params.tx;
        var query = params.query;
        var whereVals = params.whereVals;
        var fromPos = params.fromPos;
        var onComplete = params.onComplete;
        var onItem = params.onItem;
        var useLimits = params.useLimits;

        var execQuery = query;
        if (useLimits) {
            var limits = params.hasOwnProperty('limit') ? params.limit : DEFAULT_LIMIT;
            if (!isNaN(limits - 0)) {
                !fromPos && (fromPos = 0);
                execQuery += ' limit ' + fromPos + ',' + limits;
            }
        }
        var returnList = params.returnList = params.returnList || [];

        tx
            .executeSql(execQuery, whereVals, function (tx, resultSet) {
                var res = tx;
                if (resultSet) {
                    res = resultSet;
                }
                var len = res.rows.length;
                for (var x = 0; x < len; x++) {
                    var item = res.rows.item(x);
                    onItem && onItem(item);
                    returnList.push(item);
                }
                if (useLimits) {
                    if (len == 0 || len <= DEFAULT_LIMIT) {
                        onComplete(codes.CODE_OK, returnList);
                    } else {
                        params.fromPos += DEFAULT_LIMIT;
                        getDataQuery(params);
                    }
                } else {
                    onComplete(codes.CODE_OK, returnList);
                }
            },
            function (tx, error) {
                error = error || tx;
                logger.error('SELECT error: ' + error.message);
                onComplete(codes.CODE_ERROR, error);
            });

    }

    function beforeBatch(toExec, onComplete) {
        if (toExec.length) {
            doBatch.call(this, toExec, onComplete);
        } else {
            onComplete(codes.CODE_EMPTY_QUERY);
        }
    }

    function doBatch(data, onComplete) {
        logger.log('doBatch -> ', data.length, data);
        var self = this;
        var db = this._db;
        var useNativeBatch = this.useNativeBatch;
        if (db) {
            if (data.length) {
                logger.log('doBatch -> working with', data.length);
                var toExec = data.splice(0, DEFAULT_LIMIT);
                if (useNativeBatch) {
                    db.sqlBatch(toExec
                        , function () {
                            doBatch.call(self, data, onComplete);
                        }, function (error) {
                            logger.error('Transaction ERROR: ' + error.message);
                            onComplete(codes.CODE_ERROR);
                        });
                } else {
                    var item = toExec[0];
                    var haveValues = (helper.isArray(item));
                    doTransaction.call(this, function (tx) {
                        helper.arrayWalk(toExec, function (item) {
                            if (haveValues) {
                                tx.executeSql(item[0], item[1]);
                            } else {
                                tx.executeSql(item);
                            }
                        });
                    }, function (code, res) {
                        if (code) {
                            onComplete(code, res);
                        } else {
                            doBatch.call(self, data, onComplete);
                        }
                    });
                }
            } else {
                logger.log('doBatch <- called ok');
                onComplete(codes.CODE_OK);
            }
        } else {
            logger.error('doBatch', 'db is not defined');
            onComplete(codes.CODE_NOT_DEFINED);
        }
    }

    cordovaDevice.onReady(function () {
        if (helper.isNative) {
            if (window.sqlitePlugin) {
                SQLiteAsPlugin = true;
                sqPlugin = window.sqlitePlugin;
            } else {
                logger.error('window.sqlitePlugin is not defined, is it exist?');
            }
        }
    });

    app('sqlite-db', function (name, params) {
        return new SqliteDbClass(name, params);
    });

})(window.app);
