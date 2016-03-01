(function(){
    var app = window.app;
    var translate = app('translate');
    var helper = app('helper');
    var logger = app('logger')('progress');

    var broadcast = app('broadcast');
    var progressEvs = broadcast.events('progress', {
        start: 'start',
        progress: 'progress',
        stop: 'stop',
        subStart: 'sStart',
        subProgress: 'sProgress',
        subProgressOverhead: 'sProgressOh',
        subStop: 'sStop'
    });

    function ProgressClass(name){
        this._collection = [];

        var guid = helper.guid();
        this._id = guid;
        this._name = name;
        
        var ev = this._ev = createProgressEv();
        ev.id = guid;
        
        this._curr = 0;
        this._total = 0;
        this._isWorking = false;
    }

    var p = ProgressClass.prototype;

    p.start = function(){
        if (!this._isWorking){
            var collection = this._collection;
            for (var i = 0, l = collection.length; i < l; i++){
                var item = collection[i];
                item.stop();
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

            broadcast.trig(progressEvs.start, this._ev);
        }
    };

    p.stop = function(){
        this._isWorking = false;
        var ev = this._ev;
        ev.total = 0;
        ev.percent = 0;
        ev.progress = 0;
        broadcast.trig(progressEvs.stop, this._ev);
    };

    p.isWorking = function(){
        return this._isWorking;
    };

    p.getId = function(){
        return this._id;
    };

    p.createSub = function(name, params){
        var collection = this._collection;
        var index = collection.length;
        var inst = new SubProgressClass(name, index, this, params);
        collection.push(inst);
        return inst;
    };

    function progressGlobal(incVal){
        if (!incVal){
            incVal = 1;
        }
        var val = this._curr = this._curr + incVal;
        var ev = this._ev;
        var perc = getPercents(this._total, val);
        ev.total = total;
        ev.percent = perc;
        ev.progress = val;

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
        }
    }

    function SubProgressClass(name, index, parent, params){
        params = params || {};
        this._name = name;
        this._parent = parent;
        var titleKey = 'progress.' + params.title;
        var title = name;
        if (translate.isExist(titleKey)){
            title = translate.getTranslate(titleKey);
        }

        var pEv = this._progressEv = createProgressEv(parent.getId());

        this._title = pEv.title = title;
        this._total = 0;
        this._curr = 0;
        this._working = false;
        this._perc = 0;
        this._index = index;
        params = null;
    }

    var subp = SubProgressClass.prototype;

    subp.getIndex = function(){
        return this._index;
    };

    subp.start = function(total){
        if (this._parent.isWorking() && !this._working){
            logger.log('name: ' + this._name, 'title: ' + this._title);
            this._working = true;
            this._total = total;
            this._curr = 0;
            this._perc = 0;
            progressGlobal.call(this._parent);
            broadcast.trig(progressEvs.subStart, this._progressEv);
        }
    };

    subp.stop = function(){
        if (this._parent.isWorking() && this._working){
            this._working = false;
            this._total = 0;
            this._curr = 0;
            this._perc = 0;
            var pEv = this._progressEv;
            pEv.total = 0;
            pEv.percent = 0;
            pEv.progress = 0;
            broadcast.trig(progressEvs.subStop, this._progressEv);
        }
    };

    subp.progress = function(val){
        if (this._parent.isWorking() && this._working){
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
            if (val <= total){
                if (changed){
                    //logger.log(this._title, perc);
                    broadcast.trig(progressEvs.subProgress, this._progressEv);
                }
            } else {
                // overhead
                if (changed) {
                    broadcast.trig(progressEvs.subProgressOverhead, this._progressEv);
                }
            }
        }
    };
    
    function getPercents(total, val){
        var perc = total ? Math.round(val * 100 / total) : 0;
        return perc;
    }

})();