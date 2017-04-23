// it's just define some methods, if it not defined
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (elt /*, from*/) {
        var len = this.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0)
            ? Math.ceil(from) 
            : Math.floor(from);
        if (from < 0)
            from += len;

        for (; from < len; from++) {
            if (from in this &&
                this[from] === elt)
                return from;
        }
        return -1;
    };
}

if (!String.prototype.replaceAll){
    String.prototype.replaceAll = function(search, replace){
        (replace === undefined) && (replace = "");
        return this.split(search).join(replace);
    };
}

if (!Array.prototype.unique){
    Array.prototype.unique = function(){
        return this.reduce(function(p, c) {
            if (p.indexOf(c) < 0) p.push(c);
            return p;
        }, []);
    };
}

if (!Array.prototype.clear) {
    Array.prototype.clear = function () {
        while(this.length > 0) {
            this.pop();
        }
    };
}

if(!String.prototype.trim){
    String.prototype.trim = function(){
        return this.replace(/^\s+|\s+$/g,'');
    };
}
if (!String.prototype.addSlashes) {
    String.prototype.addSlashes = function () {
        //no need to do (str+'') anymore because 'this' can only be a string
        return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    };
}
