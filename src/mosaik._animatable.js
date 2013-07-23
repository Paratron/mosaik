/**
 * Animation Object
 * ================
 * Adds sprite animations to a map object.
 */
(function (){
    'use strict';

    var mosaik;
    if(typeof window === 'undefined'){
        mosaik = exports || require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    mosaik._animatable = {
        isAnimatable: true,
        currentAnimation: null,
        //animationFPS: 30,
        //animations: {},
        setAnimation: function (key, directed){
            var anim,
                that,
                defer,
                animationDirection;

            if(this.defaultIndex === undefined){
                this.defaultIndex = this.paletteIndex;
            }

            if(directed && this.isMoveable){
                key += ':' + this.direction;
                animationDirection = this.direction;
            }

            if(!this.animations || !this.animations[key]){
                throw new Error('Animation "' + key + '" not found on this object.');
            }

            if(this.currentAnimation){
                this.currentAnimation.finished = true;
            }

            anim = this.animations[key];
            that = this;

            if(anim instanceof Array){
                anim = {
                    frames: anim,
                    loop: true
                };
            }

            this.currentAnimation = this.map.currentStage.createTween({
                frameLimit: anim.fps || that.animationFPS || 30,
                beginValue: 0,
                finishValue: anim.frames.length - 1,
                updateFunction: function(){
                    if(animationDirection && animationDirection !== that.direction){
                        that.stopAnimation();
                        that.setAnimation(key.split(':')[0], directed);
                    }
                    that.paletteIndex = anim.frames[Math.floor(this.value)];
                },
                finishFunction: function(){
                    that.trigger('animationFinish:' + key);
                    if(defer){
                        defer.resolve();
                    }
                    if(anim.loop){
                        if(directed){
                            key = key.split(':')[0];
                        }
                        that.setAnimation(key, directed);
                    }
                }
            });

            if(window.Q){
                defer = window.Q.defer();
                return defer.promise;
            }
        },
        stopAnimation: function(){
            this.currentAnimation.finished = true;
            delete this.currentAnimation;
            this.paletteIndex = this.defaultIndex;
        }
    };
})();