(function (app) {

    var logger = app('logger')('ast-parse');
    var translate = app('translate');
    var helper = app('helper');
    var astParseComponents = app('ast-parse-components');

    var includesReg = new RegExp('{{.*?}}', 'ig');

    var tagRE = /(?:<!--[\S\s]*?-->|<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>)/g;
    var parseTag = app('ast-parse-tag');
    var defOpt = {};

// re-used obj for quick lookups of components

    function createLang(text, content) {
        var tmp;
        if (text.indexOf('<') == -1 && text.indexOf('>') == -1) {
            tmp = document.createTextNode(text);
        } else {
            tmp = document.createElement('span');
            tmp.innerHTML = text;
        }
        return {
            type: 'lang',
            el: tmp,
            content: content
        };
    }

    function createText(content) {
        return {
            type: 'text',
            el: document.createTextNode(content),
            content: content
        };
    }

    function addLangs(matches, content, parent){
        var list = parent.nodes;
        var currPos = 0;
        var textNode;
        var childEl;
        for (var i = 0, l = matches.length; i < l; i++) {
            var lang = matches[i];

            var endPos = content.indexOf(lang, currPos - 1);
            textNode = content.substring(currPos, endPos);
            currPos = endPos;
            textNode && list.push(createText(textNode));
            childEl = createLang(translate(lang), lang);
            list.push(childEl);
        }
        textNode = content.substring(endPos + lang.length);
        textNode && list.push(createText(textNode));
    }

// common logic for pushing a child node onto a list
    function pushTextNode(parent, html, level, start, ignoreWhitespace) {
        var list = parent.nodes;
        // calculate correct end of the content slice in case there's
        // no tag after the text node.
        var end = html.indexOf('<', start);
        var content = html.slice(start, end === -1 ? undefined : end);
        // if a node is nothing but whitespace, collapse it as the spec states:
        // https://www.w3.org/TR/html4/struct/text.html#h-9.1
        includesReg.lastIndex = 0;
        var matches = content.match(includesReg);
        if (matches) {
            addLangs(matches, content, parent);
        } else {
            if (/^\s*$/.test(content)) {
                content = ' ';
            }
            // don't add whitespace-only text nodes if they would be trailing text nodes
            // or if they would be leading whitespace-only text nodes:
            //  * end > -1 indicates this is not a trailing text node
            //  * leading node is when level is -1 and list has length 0
            if ((!ignoreWhitespace && end > -1 && level + list.length >= 0) || content !== ' ') {
                list.push(createText(content));
            }
        }
    }

    function appendChild(_curr) {
        var _el = _curr.el;
        _el && helper.arrayWalk(_curr.nodes, function (node) {
            node.el && _el.appendChild(node.el);
        });
    }

    function extendAttrs(dest, source) {
        for (var key in source) {
            if (!dest.hasOwnProperty(key)) {
                dest[key] = source[key];
            } else {
                dest[key] += (' ' + source[key]);
            }
        }
    }

    app('ast-parse', function parse(context, html, options) {
        options || (options = defOpt);
        var result = [];
        var current;
        var level = -1;
        var tagLevels = [];
        var inComponent = false;

        var retNode;


        html.replace(tagRE, function (tag, index) {
            var isOpen = tag.charAt(1) !== '/';
            var isComment = tag.indexOf('<!--') === 0;
            var start = index + tag.length;
            var nextChar = html.charAt(start);
            var parent;

            if (isOpen && !isComment) {
                level++;

                current = parseTag(tag);

                if (!current.voidElement && !inComponent && nextChar && nextChar !== '<') {
                    pushTextNode(current, html, level, start, options.ignoreWhitespace);
                }

                // byTag[current.tagName] = current;

                // if we're at root, push new base node
                if (level === 0) {
                    retNode = current;
                    // result.push(current);
                }

                parent = tagLevels[level - 1];

                if (parent) {
                    parent.nodes.push(current);
                }

                tagLevels[level] = current;

                if (current.tag == 'children') {
                    astParseComponents.onChildrenTag.call(context, parent, current);
                }
            }

            if (isComment || !isOpen || current.voidElement) {
                if (!isComment) {
                    var _curr = tagLevels[level];
                    if (_curr.type == 'component') {
                        // create component here
                        var newCurr = tagLevels[level] = astParseComponents.onComponentParsed.call(context, _curr);
                        var pLevel = tagLevels[level - 1];
                        if (pLevel) {
                            pLevel.nodes[pLevel.nodes.length - 1] = newCurr;
                        }
                        extendAttrs(newCurr.attrs, _curr.attrs);
                        _curr = newCurr;
                        if (level == 0) {
                            retNode = newCurr;
                        }
                    }
                    appendChild(_curr);

                    level--;
                }
                if (!inComponent && nextChar !== '<' && nextChar) {
                    // trailing text node
                    // if we're at the root, push a base text node. otherwise add as
                    // a child to the current node.
                    parent = level === -1 ? retNode : tagLevels[level];
                    pushTextNode(parent, html, level, start, options.ignoreWhitespace);
                }
            }
        });
        // If the "html" passed isn't actually html, add it as a text node.
        if (!result.length && html.length) {
            pushTextNode(retNode, html, 0, 0, options.ignoreWhitespace);
        }

        return retNode;
    });

})(window.app);
