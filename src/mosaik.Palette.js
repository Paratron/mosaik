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
        mosaik = require('mosaik');
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
            drawContext;

        that = this;

        tileMap = params.mapImage;

        this.ready = false;

        if(params.size){
            this.tileWidth = this.tileHeight = tileSizeW = tileSizeH = params.size;
        } else {
            this.tileWidth = tileSizeW = params.sizeW;
            this.tileHeight = tileSizeH = params.sizeH;
        }

        if(tileMap instanceof Image){
            mapWidth = tileMap.width / tileSizeW;
            mapHeight = tileMap.height / tileSizeH;
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
            tileMap = new Image();
            tileMap.onload = function (){
                mapWidth = tileMap.width / tileSizeW;
                mapHeight = tileMap.height / tileSizeH;
                that.ready = true;
                that.trigger('ready', that);
            };
            tileMap.src = params.mapImage;
        }

        this.draw = function (index, x, y){
            var srcY = ~~(index / mapWidth);
            var srcX = (index - srcY * mapHeight) * tileSizeH;
            srcY *= tileSizeW;
            drawContext.drawImage(tileMap, srcX, srcY, tileSizeW, tileSizeH, x, y, tileSizeW, tileSizeH);
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