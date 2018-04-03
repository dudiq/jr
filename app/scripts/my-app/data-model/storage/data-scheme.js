(function (app) {
    var helper = app('helper');

    var scheme = [{
        name: 'expenses',
        indexOn: 'id',
        fields: [
            {name: 'id'},
            {name: 'time'},
            {name: 'cost'},
            {name: 'desc'},
            {name: 'state'},
            {name: 'catId'},
            {name: 'pouchId'},
            {name: 'dateBegin'},
            {name: 'dateEnd'}
        ]
    }, {
        name: 'categories',
        indexOn: 'id',
        fields: [
            {name: 'id'},
            {name: 'title'},
            {name: 'catId'},
            {name: 'pouchId'},
            {name: 'dateBegin'},
            {name: 'dateEnd'}
        ]
    }, {
        name: 'pouches',
        indexOn: 'id',
        fields: [
            {name: 'id'},
            {name: 'name'},
            {name: 'desc'},
            {name: 'dateBegin'},
            {name: 'dateEnd'}
        ]
    }];

    var SCHEME_VERSION = 4;

    // if version changed, add migrate scripts too!!!
    helper.extendObject(scheme, {
        version: SCHEME_VERSION,
        getFieldsNames: function (name) {
            var ret = [];
            for (var i = 0, l = scheme.length; i < l; i++){
                var item = scheme[i];
                if (item.name == name) {
                    helper.arrayWalk(item.fields, function (item) {
                        ret.push(item.name);
                    });
                    break;
                }
            }
            return ret;
        },
        getScheme: function (name) {
            var ret;
            for (var i = 0, l = scheme.length; i < l; i++){
                var item = scheme[i];
                if (item.name == name) {
                    ret = helper.clone(item);
                    break;
                }
            }
            return ret;
        }
    });

    app('data-scheme', scheme);

})(window.app);
