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
    //TODO: FIX THIS.
    if(typeof window !== 'undefined' && window.mozRequestAnimationFrame === undefined){
        //Shim for everything except FF.
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
    } else {
        //Shim for firefox. :-S
        mosaik.requestAnimationFrame = function (cb){
            return window.mozRequestAnimationFrame(cb);
        };
        mosaik.cancelAnimationFrame = function (id){
            return window.mozCancelRequestAnimationFrame(id);
        };
    }

    /**
     * Mosaiks own implementation of commonJS Promises/A.
     * @param {Object} target Scope of the promise.
     * @constructor
     */
    mosaik.Promise = function (target){
        this._promiseTarget = target || root;
    };
    mosaik.Promise.prototype = {
        resolve: function (){
            var result;

            if(typeof this._promiseSuccess === 'function'){
                result = this._promiseSuccess.call(this._promiseTarget, arguments);

                if(result instanceof mosaik.Promise){
                    result.then(this._promiseChild.resolve, this._promiseChild.reject);
                } else {
                    this._promiseChild.resolve.call(this._promiseTarget, result);
                }

                return;
            }
            this._promiseResolved = arguments;
        },
        reject: function (){
            var result;

            if(typeof this._promiseError === 'function'){
                result = this._promiseError.call(this._promiseTarget, arguments);

                if(result instanceof mosaik.Promise){
                    result.then(this._promiseChild.resolve, this._promiseChild.reject);
                } else {
                    this._promiseChild.reject.call(this._promiseTarget, result);
                }

                return;
            }
            this._promiseRejected = arguments;
        },
        then: function (success, error){
            this._promiseSuccess = success;
            this._promiseError = error;
            this._promiseChild = new mosaik.Promise();

            if(this._promiseResolved !== undefined){
                this._promiseChild.resolve.call(this._promiseTarget, this._promiseResolved);
            }

            if(this._promiseRejected !== undefined){
                this._promiseChild.reject.call(this._promiseTarget, this._promiseRejected);
            }

            return this._promiseChild;
        }
    };

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