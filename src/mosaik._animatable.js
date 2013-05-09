/**
 * Animation Object
 * ================
 *
 */
(function (){
    'use strict';

    var mosaik;
    if(typeof window === 'undefined'){
        mosaik = exports || require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    mosaik._animatable = function(params){

    };

    mosaik._animatable.prototype = {
        animate: function(values, duration){

        }
    };
})();