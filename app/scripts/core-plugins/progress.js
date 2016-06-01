(function(){
    var app = window.app;
    var translate = app('translate');
    var helper = app('helper');
    var logger = app('logger')('progress');
    var broadcast = app('broadcast');
    var translateEvs = broadcast.events('translate');


    var progressEvs = broadcast.events('progress', {
        start: 'start',
        progress: 'progress',
        stop: 'stop',
        subStart: 'sStart',
        subProgress: 'sProgress',
        subProgressOverhead: 'sProgressOh',
        subStop: 'sStop'
    });

    function ProgressClass(name, params){
        this._collection = [];
        params = params || {};

        var guid = helper.guid();
        this._id = guid;
        this._name = name;
        
        var ev = this._ev = createProgressEv();
        ev.id = guid;
        
        this._curr = 0;
        this._total = 0;
        this._isWorking = false;
        this._translateBlock = params.translateBlock || 'progress';
        this._onCallbacks = {
            onStart: params.onStart,
            onProgress: params.onProgress,
            onStop: params.onStop,
            onSubStart: params.onSubStart,
            onSubProgress: params.onSubProgress,
            onSubProgressOverhead: params.onSubProgressOverhead,
            onSubStop: params.onSubStop
        };
    }

    helper.extendClass(ProgressClass, {
        startProgress: function () {
            if (!this._isWorking) {
                var collection = this._collection;
                for (var i = 0, l = collection.length; i < l; i++) {
                    var item = collection[i];
                    item.stopProgress();
                }
                var val = 0;
                this._curr = val;
                var total = this._total = collection.length;
                this._isWorking = true;
                var ev = this._ev;
                var perc = getPercents(total, val);
                ev.total = total;
                ev.percent = perc;
                ev.progress = val;
                this._onCallbacks.onStart && this._onCallbacks.onStart(ev);
                broadcast.trig(progressEvs.start, ev);
            }
        },
        stopProgress: function () {
            this._isWorking = false;
            var ev = this._ev;
            ev.total = 0;
            ev.percent = 0;
            ev.progress = 0;
            this._onCallbacks.onStop && this._onCallbacks.onStop(ev);
            broadcast.trig(progressEvs.stop, ev);
        },
        isWorking: function () {
            return this._isWorking;
        },
        getId: function () {
            return this._id;
        },
        getTranslateBlock: function() {
            return this._translateBlock;
        },
        createSubProgress: function (name, params) {
            var collection = this._collection;
            var index = collection.length;
            var inst = new SubProgressClass(name, index, this, params);
            collection.push(inst);
            return inst;
        }
    });
    

    function progressGlobal(incVal){
        if (!incVal){
            incVal = 1;
        }
        var val = this._curr = this._curr + incVal;
        var ev = this._ev;
        var perc = getPercents(this._total, val);
        ev.total = this._total;
        ev.percent = perc;
        ev.progress = val;

        this._onCallbacks.onProgress && this._onCallbacks.onProgress(ev);
        broadcast.trig(progressEvs.progress, ev);
    }

    function createProgressEv(parentId){
        return {
            parentId: parentId,
            id: null,
            title: '',
            total: 0,
            progress: 0,
            percent: 0
        };
    }

    function SubProgressClass(name, index, parent, params){
        var self = this;
        params = params || {};
        this._name = name;
        this._parent = parent;
        this._title = params.title;

        this._progressEv = createProgressEv(parent.getId());

        translateTitle.call(self);

        broadcast.on(translateEvs.onLangSet, function(){
            translateTitle.call(self);
        });


        this._total = 0;
        this._curr = 0;
        this._working = false;
        this._perc = 0;
        this._index = index;
        params = null;
    }

    function translateTitle(){
        var pEv = this._progressEv;
        var titleKey = this._parent.getTranslateBlock() + '.' + this._title;
        pEv.title = translate.getTranslate(titleKey);
    }

    helper.extendClass(SubProgressClass, {
        getIndex: function () {
            return this._index;
        },
        startProgress: function (total) {
            if (this._parent.isWorking() && !this._working) {
                //logger.log('name: ' + this._name, 'title: ' + this._title);
                this._working = true;
                this._total = total;
                this._curr = 0;
                this._perc = 0;
                progressGlobal.call(this._parent);
                var parentCbs = this._parent._onCallbacks;
                var progEv = this._progressEv;
                parentCbs.onSubStart && parentCbs.onSubStart(progEv);
                broadcast.trig(progressEvs.subStart, progEv);
            }
        },
        stopProgress: function () {
            if (this._parent.isWorking() && this._working) {
                this._working = false;
                this._total = 0;
                this._curr = 0;
                this._perc = 0;
                var pEv = this._progressEv;
                pEv.total = 0;
                pEv.percent = 0;
                pEv.progress = 0;
                var parentCbs = this._parent._onCallbacks;
                parentCbs.onSubStop && parentCbs.onSubStop(pEv);

                broadcast.trig(progressEvs.subStop, pEv);
            }
        },
        progressMe: function (val) {
            if (val === undefined){
                val = this._curr + 1;
            }
            var parent = this._parent;
            if (parent.isWorking() && this._working) {
                var parentCbs = parent._onCallbacks;
                this._curr = val;
                var pEv = this._progressEv;
                var total = this._total;
                var perc = getPercents(total, val);
                var changed = false;
                if (perc != this._perc) {
                    this._perc = perc;
                    changed = true;
                    pEv.total = total;
                    pEv.percent = perc;
                    pEv.progress = val;
                }
                if (val <= total) {
                    if (changed) {
                        //logger.log(this._title, perc);
                        parentCbs.onSubProgress && parentCbs.onSubProgress(pEv);
                        broadcast.trig(progressEvs.subProgress, pEv);
                    }
                } else {
                    // overhead
                    if (changed) {
                        parentCbs.onSubProgressOverhead && parentCbs.onSubProgressOverhead(pEv);
                        broadcast.trig(progressEvs.subProgressOverhead, pEv);
                    }
                }
            }
        }
    });
    
    function getPercents(total, val){
        var perc = total ? Math.round(val * 100 / total) : 0;
        return perc;
    }

    app('progress-class', ProgressClass);

})();