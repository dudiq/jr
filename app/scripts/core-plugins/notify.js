/*
* notify plugin for show system messages (for example)
* */
(function(){
    var app = window.app;
    var notify = app('notify', {});
    var helper = app('helper');
    var templater = app('templater');

    var DEFAULT_TIMEOUT = 7000; // 7 seconds
    var TIMEOUT = DEFAULT_TIMEOUT;
    var demandTimerId;

    // place, where all messages will be
    var container;

    // string template for single message
    var template = templater.get('notify');

    // collection of all messages
    var quene = [];

    var autoClean = true;

    // how much messages can be shown
    var MAX_OPEN = 5;

    var preBuffContainer = $("<div/>");

    var BTN_TPL = '<td class="jr-notify-btn"></td>';

    var CLOSE_CLASS_BTN = 'jr-notify-btn-close';

    var CONST_ID = 'jr-notify-id';

    function getHideTime(){
        var nowTime = (new Date()).getTime();
        var ret = nowTime + TIMEOUT;
        return ret;
    }

    // add DOM element to container, when it needed
    function addToDOM(bunch){
        if (bunch){
            var el = bunch.el;
            if (el){
                if (container){
                    container.prepend(el);
                    bunch.hideTime = getHideTime();
                } else {
                    preBuffContainer.prepend(el);
                }
            }
        }
    }

    // bind to close message DOM element
    // remove from quene
    // and show next message from quene
    function onContainerClick(ev){
        var target = $(ev.target);
        var el = target.closest('.jr-notify-item');
        if (el.length){
            var id = el.data(CONST_ID);
            if (id){
                var pos = findItemPos(id);
                var item = (pos != -1) ? quene[pos] : null;

                if (item){
                    var btnEl = target.closest('.jr-notify-btn');
                    var btns = item.params.btns;
                    if (btns && btns.length){
                        // process buttons clicks
                        for (var i = 0, l = btns.length; i < l; i++){
                            var btnItem = btns[i];
                            if (btnEl.hasClass(btnItem.className)){
                                btnItem.onClick && btnItem.onClick(item.note);
                                break;
                            }
                        }
                    } else {
                        // just process remove click only
                        if (btnEl.hasClass(CLOSE_CLASS_BTN)){
                            // remove
                            item.note.remove();
                        }
                    }
                } else {
                    el.remove();
                }

            }
        }
        el = null;
        target = null;
    }

    // find item position by id field
    function findItemPos(id){
        var ret = -1;
        for (var i = 0, l = quene.length; i < l; i++){
            var item = quene[i];
            if (item.id == id){
                ret = i;
                break;
            }
        }
        return ret;
    }

    function _removeItem(item, pos){
        item.params.onClose && item.params.onClose();
        quene.splice(pos, 1);
        item.el.remove().empty();
        item.el = null;
        item.params = null;
        item.id = null;
        item.note = null;
        var bunch = quene[MAX_OPEN - 1];
        bunch && addToDOM(bunch);
    }

    function removeItem(id){
        var pos = findItemPos(id);
        var item = (pos != -1) ? quene[pos] : null;
        _removeItem(item, pos);
    }

    function createBtns(el, btns){
        if (btns && btns.length){
            var buff = $( document.createElement('div') );
            var $tpl;
            for (var i = 0, l = btns.length; i < l; i++){
                var btn = btns[i];
                $tpl = $(BTN_TPL);
                $tpl.addClass(btn.className);
                buff.append($tpl);
            }
            el.find('.jr-notify-btn').replaceWith(buff.children());
            buff.remove();
            buff = null;
            $tpl = null;
        }
    }

    function stopDemandRemove(){
        demandTimerId && clearTimeout(demandTimerId);
        demandTimerId = null;
    }

    function startDemandRemove(){
        if (!demandTimerId && TIMEOUT !== 0){
            demandTimerId = setTimeout(function(){
                var nowTime = (new Date()).getTime();
                for (var i = quene.length - 1; i >= 0; i--){
                    var item = quene[i];
                    if (item.hideTime && item.hideTime <= nowTime){
                        // remove it
                        _removeItem(item, i);
                    }
                }
                stopDemandRemove();
                if (quene.length){
                    startDemandRemove();
                }
            }, 1000);
        }
    }

    function setShowTime(){
        var len = quene.length;
        for (var i = 0; i < len; i++){
            quene[i].hideTime = getHideTime();
        }
    }

    function catchClickEvents(){
        app('top-dom-elements').getBody()
            .on('jrclick', function(){
                // this is hack for bind to body action
            })
            .on('jrdeffered', function(){
                autoClean && startDemandRemove();
            });
    }

    // error message
    notify.error = function(message, params){
        var note = notify.show(message, 'danger', params);
        return note;
    };

    // info message
    notify.info = function(message, params){
        var note = notify.show(message, 'info', params);
        return note;
    };

    // warning message
    notify.warn = function(message, params){
        var note = notify.show(message, 'warn', params);
        return note;
    };

    // show message, as base method for showing all types of messages
    //
    // message - string
    // icon - icon, if needed for indicate type of notify
    notify.show = function(message, icon, params){
        var item = template;
        params = params || {};
        item = item.replaceAll('{{message}}', message || "");
        item = item.replaceAll('{{icon}}', icon || "");
        item = templater.translate(item);
        var id = helper.guid();
        var el = $(item);
        el.data(CONST_ID, id);

        var note = {
            remove: function(){
                removeItem(id);
            }
        };

        createBtns(el, params.btns);

        var bunch = {
            hideTime: 0,
            id: id,
            params: params,
            el: el,
            note: note
        };
        quene.push(bunch);

        if (quene.length <= MAX_OPEN){
            addToDOM(bunch);
        }

        return note;
    };

    // remove all messages from quene and DOM
    notify.clean = notify.clear = function(){
        for (var i = 0, l = quene.length; i < l; i++){
            var item = quene[i];
            item.el.off().remove();
            item.el = null;
            item.params = null;
            item.id = null;
            item.note = null;
            item = null;
        }
        quene.clear();
        return this;
    };

    notify.setTimeoutClean = function(msValue){
        if (msValue){
            TIMEOUT = msValue;
        } else {
            TIMEOUT = DEFAULT_TIMEOUT;
        }
    };

    notify.autoClean = function(val){
        if (val !== undefined){
            autoClean = val;
        }
        return autoClean;
    };

    notify.setContainer = function(newContainer){
        if (container){
            // move all messages to new container
            newContainer.append(container.children());
        }
        container && container.off('jrclick', onContainerClick);
        container = newContainer;
        container.append(preBuffContainer.children());
        preBuffContainer.empty();
        newContainer.on('jrclick', onContainerClick);
        setShowTime();
        catchClickEvents();
    };

    helper.onDomReady(function(){
        var cont = $('.jr-notify-container');
        if (!cont.length){
            cont = $('<div class="jr-notify-container"></div>');
            app('top-dom-elements').getBody().append(cont);
        }
        notify.setContainer(cont);
    });
})();