/*
* console for debug on all devices and browsers
*
* required jquery for dom manipulations and DOM event bindings
*
* */
(function(){

    if (!String.prototype.replaceAll){
        String.prototype.replaceAll = function(search, replace){
            (replace === undefined) && (replace = "");
            return this.split(search).join(replace);
        }
    }

    var showConsole = window['jrShowConsoleFlag'];

    var isNativeConsole = !!window['console'];

    var console = isNativeConsole ? window.console : window.console = {};

    var obj = {};

    if (showConsole){
        init();
    }

    window.jrShowConsole = function(){
        init();
    };

    function init(){
        window.jrShowConsole = function(){};
        var $body = $(document.body);
        var parent = obj.parent = $("<div class='console-parent console-hide'></div>");
        var clearBtn = $("<div class='console-clear-btn console-btn'>clear</div>");

        clearBtn.on('click', function(ev){
            container.empty();
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        });

        var showBtn = $("<div class='console-show-btn console-btn'>s/h</div>");

        showBtn.on('click', function(ev){
            parent.toggleClass('console-hide');
            if (parent.hasClass('console-hide')){
                scroll();
            }
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        });



        parent.on("click", function(ev){
            var t = $(ev.target);
            if (t.hasClass('console-title') || t.hasClass('console-obj-data')){
                var pt = t.closest('.console-object');
                pt.toggleClass('console-obj-show');
            }
        });


        var subcont = obj.subcont = $("<div class='console-subcontainer'></div>");
        parent.append(subcont);

        var container = obj.container = $("<div class='console-container'></div>");
        subcont.append(container);

        var input = obj.input = $("<input type='text' class='console-input'>");
        parent.append(input);

        input.on("keypress", function(ev){
            if (ev.keyCode == 13){
                var cmd = input.val();
                input.val("");
                runCmd(cmd);
            }
        });


        parent.append(showBtn);
        parent.append(clearBtn);

        var isCordova = !!window.cordova;

        if (isNativeConsole){
            var logOld = console.log;
            console.log = function(){
                var args = isCordova ? [parseArguments(arguments, false)] : arguments;
                logOld.apply(console, args);
                log.apply(obj, arguments);
            };

            var logWarn = console.warn;
            console.warn = function(){
                var args = isCordova ? [parseArguments(arguments, false)] : arguments;
                logWarn.apply(console, args);
                warn.apply(obj, arguments);
            };

            var logError = console.error;
            console.error = function(){
                var args = isCordova ? [parseArguments(arguments, false)] : arguments;
                logError.apply(console, args);
                error.apply(obj, arguments);
            };

        } else {
            console.log = log;
            console.warn = warn;
            console.error = error;
        }

        defineOnError();

        var style = $("<style>.console-parent{ position: fixed; bottom: 0px; height: 30%; width: 100%; z-index: 10000; border-top: 1px solid #000; " +
            "background-color: rgba(255,255,255,0.8); color:#000; overflow: hidden; }" +
            ".console-hide {height: 2%;}" +
            ".console-log {border-top: 1px solid #fff; vertical-align:top;}" +
            ".console-warn {color: green;}" +
            ".console-error {color: red;}" +
            ".console-container {margin-bottom: 24px; border-bottom: 1px dashed green; margin-left: 2px;}" +
            ".console-subcontainer {position: absolute; width:100%; height: 100%; overflow: auto; }" +
            ".console-input {position: absolute; bottom: 0px; width:100%; height:24px; padding: 0 5px; border:none; border-top: 1px solid gray; }" +
            ".console-btn {opacity:0.5; position: absolute; right: 0; bottom: 0; width: 40px; height: 40px; background: #000; color: #fff}" +
            ".console-clear-btn{right: 45px;}" +
            ".console-object .console-title{color: red; font-weight:bold; vertical-align:top;}" +
            ".console-object .console-obj-data{ display:none;}" +
            ".console-object.console-obj-show > .console-obj-data{ display:inline-block;}" +
            "</style>");

        $(document).ready(function(){
            $("head").append(style);
            $body.append(parent);
        });


    }


    function runCmd(cmd){
        try{
            cmd = 'console.log(' + cmd + ')';
            eval.call(window, cmd);
        } catch(e){
            console.error(e);
        }

    }

    var currDate = new Date();

    function parseTime(time, oldTime){
        // time - in ms
        var dx = (time - oldTime);
        var ret = "";

        if (dx < 1000){
            ret = dx + " ms";
        } else if (dx < 1000 * 60){
            ret = Math.round(dx / 1000) + " s";
        } else if (dx < 1000 * 60 * 60){
            ret = Math.round(dx / (1000 * 60)) + "min";
        }
        ret = ret + "; ";
        return ret;
    }

    var simpleTypes = ['number', 'string', 'boolean'];
    function parseItem(item, useHTML, showFirst){
        var type = typeof item;
        var ret = "";
        if (simpleTypes.indexOf(type) == -1){
            if (type == "function"){
                ret = "function...";
            } else {
                if (item === null){
                    ret = "null";
                } else if (item === undefined){
                    ret = "undefined";
                } else {
                    if (useHTML){
                        ret = "<span class='console-object " + (showFirst ? "console-obj-show" : "") + "'><span class='console-title'>[object]</span><br><span class='console-obj-data'>";
                    }

                    item.stack && item.stack;
                    item.message && item.message;

                    for (var key in item){
                        if (useHTML){
                            ret += "&nbsp;&nbsp;&nbsp;" + key + ":" + parseItem(item[key], useHTML) + "<br>";
                        } else{
                            ret += "  \t" + key + ":" + parseItem(item[key], useHTML) + "\n";
                        }
                    }
                    if (useHTML){
                        ret += "</span></span>";
                    }
                }
            }
        } else {
            if (useHTML){
                ret = (item + "").replaceAll("\n", "<br>");
                ret = getEscapedText(ret);
            } else {
                ret = item;
            }
        }
        return ret;
    }

    function parseArguments(args, useHTML){
        var parseDate = new Date();
        var time = parseTime(parseDate.getTime(), currDate.getTime());
        var text = time + "";
        currDate = parseDate;
        for (var i = 0, l = args.length; i < l; i++){
            var item = args[i];
            text = text + parseItem(item, useHTML, true) + "; ";
        }


        return text;
    }

    var safeTextBuff = $("<div/>");
    function getEscapedText(text){
        text = text || "";
        return safeTextBuff.text(text).html();
    }

    function addData(args, logDiv){
        var text = parseArguments(args, true);
        logDiv.html(text);

        var el = obj.subcont[0];

        var doScroll = ((el.scrollTop + obj.subcont.innerHeight()) == el.scrollHeight);

        obj.container.append(logDiv);

        doScroll && scroll();
    }

    function scroll(){
        var el = obj.subcont[0];
        el.scrollTop = el.scrollHeight;
    }

    function log(){
        var logDiv = $("<div class='console-log'></div>");
        addData(arguments, logDiv);
    }

    function warn(){
        var logDiv = $("<div class='console-warn console-log'></div>");
        addData(arguments, logDiv);
    }

    function error(){
        var logDiv = $("<div class='console-error console-log'></div>");
        addData(arguments, logDiv);
    }


    function defineOnError(){
        var oldError = window.onerror;
        window.onerror = function(message, url, linenumber, errObj){
            error.apply(obj, arguments);
            oldError && oldError.apply(window, arguments);
        };

    }

})();