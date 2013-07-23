/**
 * Moveable Object Extension
 * =========================
 * This extension adds smooth movement to map objects.
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

    mosaik._moveable = {
        isMoveable: true,
        currentTween: null,
        activeMovement: null,
        direction: 's',
        moveSpeed: 0.0333, //The amount of tiles the object should move within one animation frame.
        /**
         * Will place the object on a new position on the map.
         * @param {Number} x
         * @param {Number} y
         */
        moveTo: function (x, y){
            var oldX,
                oldY;

            oldX = this.x;
            oldY = this.y;

            this.x = x;
            this.y = y;

            if(!this.map.placeObject(this, this.layer, x, y, oldX, oldY)){
                throw new Error('Placing error');
            }
            this.trigger('move', x, y, oldX, oldY);
        },
        moveBy: function (x, y, duration){

        },
        moveAlong: function (path, duration){
            var moveSpeed,
                moveTime,
                tileSizeW,
                tileSizeH,
                that,
                stage,
                moveID,
                defer;

            if(!path.length){
                return;
            }

            if(duration){
                moveSpeed = path.length / (duration / this.map.currentStage.tweenTime);
            } else {
                moveSpeed = this.moveSpeed;
            }

            moveTime = this.map.currentStage.tweenTime / (1 / moveSpeed) * 100;

            moveID = Math.random();

            stage = this.map.currentStage;
            tileSizeW = this.map.palette.tileWidth;
            tileSizeH = this.map.palette.tileHeight;
            that = this;
            this.activeMovement = moveID;

            function moveToNext(){
                var nextField,
                    tween,
                    direction,
                    vals;

                if(!path.length || that.activeMovement !== moveID){
                    if(defer){
                        defer.resolve();
                    }
                    return;
                }

                nextField = path.shift();

                direction = that.x < nextField.x ? 'e' : direction;
                direction = that.x > nextField.x ? 'w' : direction;
                direction = that.y > nextField.y ? 'n' : direction;
                direction = that.y < nextField.y ? 's' : direction;

                if(that.direction !== direction){
                    that.trigger('directionChange', direction);
                }

                that.direction = direction;

                vals = {
                    e: tileSizeW,
                    w: -tileSizeW,
                    n: -tileSizeH,
                    s: tileSizeH
                };

                if(that.currentTween){
                    that.currentTween.finished = true;
                }

                tween = stage.createTween({
                    beginValue: 0,
                    finishValue: vals[direction],
                    duration: moveTime,
                    updateFunction: function(){
                        if(direction === 'w' || direction === 'e'){
                            that.dynOffsX = this.value;
                            that.dynOffsY = 0;
                        } else {
                            that.dynOffsX = 0;
                            that.dynOffsY = this.value;
                        }
                    },
                    finishFunction: function(){
                        that.dynOffsX = that.dynOffsY = 0;
                        that.moveTo(nextField.x, nextField.y);
                        moveToNext();
                    }
                });

                that.currentTween = tween;
            }

            moveToNext();

            if(window.Q){
                defer = window.Q.defer();
                return defer.promise;
            }
        }
    };
})();