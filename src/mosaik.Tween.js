/**
 * Tween Object
 * ============
 * This object is used to create a transit
 */
(function (){
    'use strict';

    var mosaik;
    if(typeof window === 'undefined'){
        mosaik = exports || require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    mosaik.Tween = function (params){
        this.duration = params.duration || null; //The duration must be given in milliseconds.

        this.frameLimit = (1000 / params.frameLimit) || null; //Optionally set a number of frames per second for this animation.
        this.lastFrame = null;  //Used when frameLimit has been set. Holds the last process timestamp.
        this.beginTime = null; //Start timestamp of the tween. Will be set in the first process() call.
        this.finishTime = null; //End timestamp of the tween. Will be set in the first process() call.
        this.beginValue = this.value = params.beginValue;
        this.finishValue = params.finishValue;
        this.finished = false;

        this.deltaValue = this.finishValue - this.beginValue;

        this.processFunction = params.processFunction; //The process function is called each "frame" of the animation.
        this.updateFunction = params.updateFunction || function(){};
        this.finishFunction = params.finishFunction || function(){};

        if(!this.processFunction){
            switch (params.tweenMode) {
            default:
                this.processFunction = function (t, beginValue, finishValue, deltaValue, currentValue){
                    return beginValue + deltaValue * t;
                };
            }
        }

        if(!this.duration){
            //No duration given - we have to make guesses :(
            if(this.finishValue === this.beginValue + 1 || this.finishValue === this.beginValue - 1){
                //Okay, we want to make steps in .1
                this.duration = (this.deltaValue * 10) * (this.frameLimit || 1000 / 30);
            } else {
                this.duration = this.deltaValue * (this.frameLimit || 1000 / 30);
            }
        }

    };

    mosaik.Tween.prototype = {
        /**
         * The process function is called from the mosaik.Stage object about 30 times a second.
         * @param deltaTime
         */
        process: function (deltaTime){
            var t;

            if(this.beginTime === null){
                this.beginTime = deltaTime;
                if(this.duration){
                    this.finishTime = deltaTime + this.duration;
                }
            }

            if(this.frameLimit){
                if(deltaTime < this.lastFrame + this.frameLimit){
                    return;
                }
                this.lastFrame = deltaTime;
            }

            t = (1 / (this.finishTime - this.beginTime)) * (deltaTime - this.beginTime);

            this.value = this.processFunction(t, this.beginValue, this.finishValue, this.deltaValue, this.value);

            this.updateFunction.call(this, t);

            if(this.finishTime && deltaTime >= this.finishTime){
                this.finishFunction();
                this.finished = true;
            }
        }
    };
})();