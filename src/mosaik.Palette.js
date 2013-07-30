/**
 * Mosaik Palette Object
 * =====================
 * This object holds information about ground tiles to be drawn on a map.
 * The ground tiles can be accessed by index.
 */
(function (){
    'use strict';

    var mosaik;
    if(typeof window === 'undefined'){
        mosaik = exports || require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    /**
     * A palette object holds one or more graphical assets to be drawn on the canvas.
     * Those can be ground tiles, objects and/or characters.
     * Palette objects are able to store animation instructions, too.
     * @param {{}} params
     * @param {Image|String} params.mapImage Can be a Image object, or a URL.
     * @param {Number} [params.size] Width and Height of a palette element in pixels (use when squared).
     * @param {Number} [params.sizeW] Width of a palette element in pixels.
     * @param {Number} [params.sizeH] Height of a palette element in pixels.
     * @constructor
     * @fires Palette#ready
     */
    mosaik.Palette = function (params){
        params = params || {};

        var tileSizeW,
            tileSizeH,
            mapWidth,
            mapHeight,
            tileMap,
            that,
            drawContext,
            animationBuffer,
            key;

        that = this;

        tileMap = params.mapImage;
        animationBuffer = [];

        function prepareAnimationBuffer(){
            var i;

            for (i = 0; i < mapWidth * mapHeight; i++) {
                animationBuffer.push(i);
            }
        }

        this.ready = false;
        this.tileAnimation = null;
        this.length = null;
        this.image = null;

        if(params.size){
            this.tileWidth = this.tileHeight = tileSizeW = tileSizeH = params.size;
        } else {
            this.tileWidth = tileSizeW = params.sizeW;
            this.tileHeight = tileSizeH = params.sizeH;
        }

        if(params.animate){
            for (key in params.animate) {
                params.animate[key].unshift(parseInt(key, 10));
                params.animate[key] = {
                    frames: params.animate[key],
                    index: parseInt(key, 10),
                    animationIndex: 0
                };
            }

            this.tileAnimation = new mosaik.Tween({
                frameLimit: params.animationFrameRate || 3,
                processFunction: function (){
                    var key,
                        anims;

                    anims = params.animate;

                    for (key in anims) {
                        anims[key].animationIndex++;
                        if(anims[key].animationIndex >= anims[key].frames.length){
                            anims[key].animationIndex = 0;
                        }
                        animationBuffer[anims[key].index] = anims[key].frames[anims[key].animationIndex];
                    }
                }
            });
        }

        if(tileMap instanceof Image){
            mapWidth = tileMap.width / tileSizeW;
            mapHeight = tileMap.height / tileSizeH;
            this.length = mapWidth * mapHeight;
            this.image = tileMap;
            prepareAnimationBuffer();
            this.ready = true;
            /**
             * Ready Event
             * Fired, when the palette has loaded the corresponding image object and is ready to be used.
             *
             * @event Palette#ready
             * @type {object} Reference to the palette object
             */
            this.trigger('ready', this);
        } else {
            if(params.mapImage){
                tileMap = new Image();
                tileMap.onload = function (){
                    mapWidth = tileMap.width / tileSizeW;
                    mapHeight = tileMap.height / tileSizeH;
                    that.length = mapWidth * mapHeight;
                    that.image = tileMap;
                    prepareAnimationBuffer();
                    that.ready = true;
                    that.trigger('ready', that);
                };
                tileMap.src = params.mapImage;
            } else {
                var canvas;
                canvas = document.createElement('canvas');
                canvas.width = tileSizeW;
                canvas.height = tileSizeH;
                tileMap = new Image();
                tileMap.src = canvas.toDataURL('image/png');
                that.length = 0;
                that.image = tileMap;
                that.ready = true;
                that.trigger('ready', that);
            }
        }

        this.draw = function (index, x, y, debugDrawing){
            var originalIndex;

            if(index === undefined || index === null){
                if(debugDrawing.tileOutlines){
                    drawContext.save();
                    drawContext.beginPath();
                    drawContext.strokeStyle = debugDrawing.tileOutlines;
                    drawContext.lineWidth = 1;
                    drawContext.rect(x, y, this.tileWidth, this.tileHeight);
                    drawContext.stroke();
                    drawContext.restore();
                }
                return;
            }

            originalIndex = index;
            index = animationBuffer[index];
            var srcY = Math.floor(index / mapWidth);
            var srcX = (index - (srcY * mapWidth)) * tileSizeW;
            srcY *= tileSizeH;
            drawContext.drawImage(tileMap, srcX, srcY, tileSizeW, tileSizeH, x, y, tileSizeW, tileSizeH);

            if(debugDrawing.tileOutlines){
                drawContext.save();
                drawContext.beginPath();
                drawContext.strokeStyle = debugDrawing.tileOutlines;
                drawContext.lineWidth = 1;
                drawContext.rect(x, y, this.tileWidth, this.tileHeight);
                drawContext.stroke();
                drawContext.restore();
            }

            if(debugDrawing.tilePaletteIndexes){
                drawContext.save();
                drawContext.font = 'monoline 8pt';
                drawContext.fillStyle = debugDrawing.tilePaletteIndexes;
                drawContext.fillText(originalIndex !== index ? originalIndex + '/' + index : index, x + 3, y + 12);
                drawContext.restore();
            }
        };

        this.setDrawContext = function (newDrawContext){
            drawContext = newDrawContext;
        };
    };

    mosaik.Palette.prototype = {

        /**
         * Adds a new image object to the palette object.
         * Use this to dynamically create a palette object and save/export it later on.
         * @param {Image} imageObj
         * @return {Number} The palette index of the newly added image.
         */
        addImage: function (imageObj){

        },

        /**
         * Creates a animation from multiple palette indexes.
         * @param {String} alias Unique string to identify the animation
         * @param {Array} frames An array of palette indexes to create the animation from
         */
        addAnimation: function (alias, frames){

        }
    };

    _.extend(mosaik.Palette.prototype, mosaik.Events);
})();