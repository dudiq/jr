(function (app) {
    var helper = app('helper');
    var logger = app('logger')('merge-entry');

    function mergeEntry(old, entry){
        if (entry && old){
            for (var key in entry) {
                if (entry.hasOwnProperty(key)) {
                    var val = entry[key];
                    if (val !== undefined) {
                        if (old[key] === undefined) {
                            old[key] = val;
                        } else {
                            if (val === null) {
                                // remove field
                                delete old[key];
                            } else {
                                // update field
                                mergeByType(old, key, val);
                            }
                        }
                    } else {
                        logger.error('value of entry by key cannot be undefined, something wrong with data', entry, key, val);
                    }
                }
            }
        }
    }

    function mergeByType(old, key, val){
        var type = typeof val;
        if (type == 'array') {
            old[key] = mergeArrays(old, key, val);
        } else if (type == 'object') {
            var oldKey = old[key] = old[key] || {};
            mergeEntry(oldKey, val);
        } else {
            old[key] = val;
        }
    }

    function mergeArrays(obj, key, arr){
        var old = obj[key];
        if (!helper.isArray(old)){
            obj[key] = arr;
        } else {
            var max = Math.max(old.length, arr.length);
            for (var i = 0; i < max; i++){
                var newItem = arr[i];
                if (newItem !== undefined){
                    mergeByType(old, i, newItem);
                }
            }
        }
    }

    app('merge-entry', mergeEntry);

})(window.app);
