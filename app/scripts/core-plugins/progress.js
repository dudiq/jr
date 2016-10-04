(function () {
    var app = window.app;
    var helper = app('helper');
    var translate = app('translate');
    var broadcast = app('broadcast');
    var translateEvs = broadcast.events('translate');

    var DEFAULT_TOTAL = 100;

    function ProgressClass(name, params){
        var self = this;
        params = params || {};
        var guid = helper.guid();
        this._id = guid;
        this._name = name;
        this._children = [];
        this._translateTitle = params.translate || 'progress';
        this._working = false;
        var parent = this._parent = params.parent;
        var pId = parent ? parent.getId() : null;
        var ev = this._ev = createProgressEv(pId, guid);
        ev.id = guid;
        setEvTitle.call(this);
        broadcast.on(translateEvs.onLangSet, function(){
            setEvTitle.call(self);
        });

        this._onStart = params.onStart;
        this._onStop = params.onStop;
        this._onProgress = params.onProgress;
    }

    helper.extendClass(ProgressClass, {
        getId: function () {
            return this._id;
        },
        getEv: function () {
            return this._ev;
        },
        createSubProgress: function (name, opt) {
            var params = opt;
            params.parent = this;
            var child = new ProgressClass(name, params);
            this._children.push(child);
            return child;
        },
        startProgress: function (total) {
            this.dropProgress();
            var cnt = 0;
            getChildren.call(this, function (child) {
                child.dropProgress();
                cnt++;
            });
            this._working = true;
            var ev = this._ev;
            ev.total = total ? total : DEFAULT_TOTAL * cnt;
            this._onStart && this._onStart();
        },
        stopProgress: function () {
            this.dropProgress();
            getChildren.call(this, function (child) {
                child.dropProgress();
            });
            this._onStop && this._onStop();
        },
        dropProgress: function () {
            this._working = false;
            var ev = this._ev;
            ev.progress = 0;
            ev.percent = 0;
            ev.total = 0;
        },
        progressFromChild: function (title) {
            var children = this._children;
            var len = children.length;
            if (len){
                var ev = this.getEv();
                var totalPerc = 0;
                for (var i = 0, l = len; i < l; i++){
                    var child = children[i];
                    var childEv = child.getEv();
                    totalPerc += childEv.percent;
                }
                var doneChildren = (totalPerc / len);
                ev.percent = doneChildren;
                ev.progress = (doneChildren * ev.total / 100);
            }
            this._parent && this._parent.progressFromChild(title);
            this._onProgress && this._onProgress(title, ev);
        },
        progressMe: function (val) {
            var ev = this._ev;
            if (val === undefined){
                val = ev.progress + 1;
            }
            var perc = getPercents(ev.total, val);
            if (perc <= 100){
                ev.percent = perc;
                ev.progress = val;
                this._parent && this._parent.progressFromChild(ev.title);
                this._onProgress && this._onProgress(ev.title, ev);
            } else {
                ev.percent = 100;
                ev.progress = ev.total;
            }
        }
    });


    function createProgressEv(parentId, id){
        return {
            parentId: parentId,
            id: id,
            title: '',
            total: 0,
            progress: 0,
            percent: 0
        };
    }

    function getParents(cb) {
        if (this._parent){
            cb(this._parent);
            getParents.call(this._parent, cb);
        }
    }

    function getChildren(cb) {
        var children = this._children;
        if (children.length){
            for (var i = 0, l = children.length; i < l; i++){
                var child = children[i];
                cb(child);
                getChildren.call(child, cb);
            }
        }
    }

    function setEvTitle() {
        var ev = this._ev;
        var tBlock = this._translateTitle;
        var parents = [tBlock];
        getParents.call(this, function (parent) {
            parents.push(parent._translateTitle);
        });

        parents.reverse();
        var toTranslate = parents.join('.');
        var title;

        if (!translate.isExist(toTranslate)){
            toTranslate += '.title';
        }

        title = translate.getTranslate(toTranslate);
        ev.title = title;
    }

    function getPercents(total, val){
        var perc = total ? Math.round(val * 100 / total) : 0;
        return perc;
    }

    app('progress-class', ProgressClass);

})();