(function(){
    var app = window.app;
    var timeMod = app('time-processor');

    // format variable can be changed WITH tasks/build-version.js grunt task !!!
    var format = {
        dateInLocale: '',
        description: 'this is app version control. dateInLocale parameter is date in your local time zone',
        changeset: '',//{{version-changeset}}
        date: '',//{{version-date}}
        major: 0,//{{version-major}}
        minor: 0,//{{version-minor}}
        build: 0,//{{version-build}}
        branch: 0,//{{version-branch}}
        revision: ''//{{version-revision}}
    };

    var viewDate = format.date ? (new Date(format.date)) : new Date();
    format.dateInLocale = timeMod.format(viewDate, 'dd/mm/yy h:m:s');

    app('build-version', {
        toString: function () {
            var str = format.major + '.' + format.minor + '.' + format.build + ' (' + format.dateInLocale + ' / ' + format.revision + ')';
            return str;
        },
        // return full info about version build
        getFull: function(){
            var ret = {};
            for (var key in format){
                ret[key] = format[key];
            }
            return ret;
        }
    });

})();
