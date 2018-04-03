(function (app) {
    // this module MUST be started before config processing
    var logger = app('logger')('multi-user');
    var ls = app('local-storage');
    var CurrentNSClass = app('current-ns-class');
    var broadcast = app('broadcast');

    var multiUserEvs = broadcast.events('multi-user', {
        onChanged: 'oc'
    });

    (function () {
        //checking define module in index.html
        var isDefined = false;
        app('mod-require')('app-config-mixin', function () {
            isDefined = true;
        });
        if (isDefined){
            logger.error('trying to define ME before config set!!!');
        }
    })();

    var multiCurrent = new CurrentNSClass({
        name: 'multi-user',
        STORE_LAST_CURRENT: 'lc',
        STORE_KEY_LIST: 'mu',
        prefix: 'u',
        max: 1, // firebase can't support multi user login, ehh =(
        routeIndex: 1,
        onCurrentDrop: function () {
            var myApp = app('my-app');
            if (myApp.isLoggedIn()){
                myApp.logout();
            }
        },
        onInit: function () {
            var indexName = this.getIndexName();
            ls.setPrefix(indexName);
        },
        onSetPrefix: function (indexName) {
            ls.setPrefix(indexName);
        }
    });

    app('multi-user', {
        getToken: function () {
            var ret = getUserField('', 'token');
            return ret;
        },
        getUserName: function () {
            var ret = getUserField('', 'name');
            return ret;
        },
        getUserInitials: function () {
            var name = getUserField('', 'nameInitials');
            return name;
        },
        getUserEmail: function () {
            var ret = getUserField('', 'email');
            return ret;
        },
        isUserCorrect: function (user) {
            var val = getUserField('', 'refreshToken', user);
            var ret = val ? true : false;
            return ret;
        },
        isLoggedIn: function () {
            var ret = false;
            var item = multiCurrent.getCurrItem();
            if (item && item.user){
                ret = item.isLogged;
            }
            return ret;
        },
        updateUserFields: function () {
            //:todo add processing users in stored data
            logger.error(':todo add processing users in stored data');
            broadcast.trig(multiUserEvs.onChanged);
        },
        logout: function () {
            multiCurrent.dropCurrentItem();
        },
        setUserAsLogged: function () {
            var node = multiCurrent.getCurrItem();
            if (node) {
                node.isLogged = true;
                multiCurrent.updateItem(node, 'id');
            }
        },
        putUser: function (user) {
            var id = user.id;
            var time = (new Date()).getTime();
            var currNS = multiCurrent.putItem({
                id: id,
                user: user.fields,
                loggedAt: time,
                isLogged: true
            }, 'id');
            return currNS;
        },
        getCurrentUserNS: function () {
            var ret = multiCurrent.getIndexName();
            return ret;
        },
        setNextUser: function (id) {
            multiCurrent.setNextItemId(id);
        },
        getUsers: function () {
            var users = [];
            var items = multiCurrent.getItems();
            var currIndex = multiCurrent.getCurrIndex();

            for (var key in items){
                var item = items[key];
                var user = item.user;
                var node = {
                    index: key,
                    email: user.email,
                    name: user.name,
                    nameInitials: user.nameInitials,
                    avatar: user.avatar,

                    setTime: item.time,
                    isCurrent: (key == currIndex)
                };
                users.push(node);
            }

            users.sort(function (a, b) {
                var aF = a.setTime;
                var bF = b.setTime;
                var ret = 0;
                if (aF != bF){
                    ret = (aF > bF) ? 1 : -1;
                }
                return ret;
            });

            return users;
        }
    });

    function getUserField(def, name, user, propName) {
        var ret = def;
        var currUser = user || getCurrentUser();
        if (currUser){
            if (propName){
                var obj = currUser[propName];
                ret = obj ? obj[name] : def;
            } else {
                ret = currUser[name];
            }
        }
        return ret;
    }

    function getCurrentUser() {
        var node = multiCurrent.getCurrItem();
        var user = node && node.user;
        return user;
    }

})(window.app);
