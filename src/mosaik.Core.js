(function (){
    'use strict';

    var root,
        mosaik;

    root = (typeof exports === 'undefined') ? window : exports;

    root.mosaik = mosaik = {

    };

    /**
     * Mapping RequestAnimationFrame onto Mosaik, or try and create something like that
     * for environments without RAF.
     */
    (function (){
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for (var x = 0; x < vendors.length && !root.requestAnimationFrame; ++x) {
            mosaik.requestAnimationFrame = root[vendors[x] + 'RequestAnimationFrame'];
            mosaik.cancelAnimationFrame =
            root[vendors[x] + 'CancelAnimationFrame'] || root[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if(!mosaik.requestAnimationFrame){
            mosaik.requestAnimationFrame = function (callback){
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = root.setTimeout(function (){
                        callback(currTime + timeToCall);
                    },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }

        if(!mosaik.cancelAnimationFrame){
            mosaik.cancelAnimationFrame = function (id){
                clearTimeout(id);
            };
        }
    }());

    /**
     * Loads a file via AJAX and returns the content to a callback.
     * @param {String} url
     * @param {Function} callback
     */
    mosaik.getUrl = function (url, callback){
        var req;

        req = new XMLHttpRequest();
        req.onload = function (){
            callback(this.responseText);
        };
        req.open('get', url, true);
        req.send();
    };

    /**
     * Just like mosaik.getUrl(), but automatically parsing the result as JSON data.
     * @param {String} url
     * @param {Function} callback
     */
    mosaik.getJSON = function (url, callback){
        mosaik.getUrl(url, function (response){
            callback(JSON.parse(response));
        });
    };

    if(typeof define === 'function' && define.amd){
        define(mosaik);
    }
})();