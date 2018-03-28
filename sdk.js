(function(win){
    var appProperties = {
        platform: "android",
        version: "26"
    }
    win.onload = function(){
        window.talkingdata.onload(JSON.stringify(appProperties));
        window.bubble.onPageFinished();
    }
})(window)

window.talkingdata = {
    configData: [],
    configInfo: {
        platform: "",
        version: ""
    },
    onload: function (data) {
        talkingdata.configInfo = JSON.parse(data);
        document.addEventListener('click', function (e) {
            //console.log("wsywsy====:" + e.target.tagName);
            var elementPath = tools.elementPath(e.target);
            for (var index in talkingdata.configData) {
                var sourcePath = talkingdata.configData[index].path;
                if ((/^\"(.+)\"$/).test(sourcePath)) {
                    sourcePath = RegExp.$1;
                }
                if (sourcePath == elementPath) {
                    var eventId = talkingdata.configData[index].id;
                    talkingdata.callNative(talkingdata.configInfo.platform, eventId);
                    break;
                }
            }
        });
    },
    getConfig: function (webviewID, webviewX, webviewY, webviewWidth, webviewHeight) {
        var nodes = tools.getAllNodes();
        var elements = [];
        var se = document.documentElement.clientHeight //浏览器可见区域高度。
        for (var index in nodes) {
            var node = nodes[index];
            if (tools.isVisible(node)) {
                var position = tools.elementPosition(node);
                var path = tools.elementPath(node);
                var nodeInfo = {
                    left: position.left,
                    top: position.top,
                    width: node.offsetWidth,
                    height: node.offsetHeight,
                    path: path,
                    hashCode: "h5_" + tools.hashCode(webviewID + path),
                    type: "h5_element",
                    webview_id: webviewID
                }
                elements.push(nodeInfo);
            }
        }
        var config = {
            webviewID: webviewID,
            webviewX: webviewX,
            webviewY: webviewY,
            webviewWidth: webviewWidth,
            webviewHeight: webviewHeight,
            elements: elements
        };
        var platform = talkingdata.configInfo.platform;
        var version = Number(talkingdata.configInfo.version);
        if (platform == "android" && version < 19) {
            return window.getPath.callback(JSON.stringify(config));
        }

        return config;
    },
    setConfig: function (config) {
        tools.getAllNodes();
        talkingdata.configData = JSON.parse(config);
    },
    callNative: function (platform, eventId) {
        if (platform == "android") {
            //console.log("回调原生自定义事件");
            window.bubble.onFireHybridEvent(eventId);
        } else if (platform == "iOS") {
            var commend = {
                functionName: "trackHybridCodelessEvent",
                arguments: [eventId]
            };
            var jsonStr = JSON.stringify(commend);
            window.location.href = "talkingdata:" + jsonStr;
        }
    }
};

var tools = {
    getAllNodes: function () {
        var elArray = [];
        var domList = function (el, index) {
            if (!tools.isExclude(el.nodeName) && el.nodeType == 1) {
                el.index = index;
                elArray.push(el);
            }
            if (el.hasChildNodes()) {
                for (var i = 0; i < el.childNodes.length; i++) {
                    domList(el.childNodes[i], i);
                }
            }
        };
        domList(document.querySelector('body'), 0);
        return elArray;
    },
    isExclude: function (nodeName) {
        var exArray = ["BODY", "BR", "P", "SCRIPT"];
        for (var index in exArray) {
            if (exArray[index] == nodeName) {
                return true;
            }
        }
        return false;
    },
    elementPosition: function (el) {
        var _x = 0, _y = 0;
        while (el && !isNaN(el['offsetLeft']) && !isNaN(el['offsetTop'])) {
            _x += el['offsetLeft'] - el.scrollLeft;
            _y += el['offsetTop'] - el.scrollTop;
            el = el['offsetParent'];
        }
        return {top: _y, left: _x};
    },
    elementPath: function (el) {
        var _path = "";
        while (el && el.nodeType == 1) {
            var indexStr = el.index == null ? "" : "[" + el.index + "]";
            _path += el.nodeName + indexStr + "/";
            el = el['parentNode'];
        }
        return _path.substr(0, _path.length - 1).split("/").reverse().join("/");
    },
    hashCode: function (str) {
        var h = 0;
        var len = str.length;
        var t = 2147483648;
        for (var i = 0; i < len; i++) {
            h = 31 * h + str.charCodeAt(i);
            if (h > 2147483647) h %= t;
        }
        return h;
    },
    isVisible: function (el) {
        var rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 && rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}
