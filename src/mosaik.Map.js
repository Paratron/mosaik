/**
 * Mosaik Map Object
 * =================
 * This object holds any information about elements of a map.
 * This contains:
 *
 * * The map tiles
 * * The map palette
 * * Objects on the map
 *
 * The map object can load its contents (the map) either from a predefined file, or can create them dynamically.
 */
(function (){
    'use strict';

    var mosaik;
    if(typeof window === 'undefined'){
        mosaik = require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    mosaik.Map = function (params){
        params = params || {};

        this.mapData = null;
        this.palette = null;
        this.width = 0;
        this.height = 0;

        var that,
            i,
            x,
            y,
            t,
            objectLayers;

        that = this;
        objectLayers = [];

        if(params.file){
            //Load the map data from a JSON file.
            mosaik.getJSON(params.file, function (fileContent){

                if(mosaik.Map.isTiledMap(fileContent)){
                    that.prepare(fileContent.width, fileContent.height, 0);
                    for (i = 0; i < fileContent.layers.length; i++) {
                        if(fileContent.layers[i].type !== 'tilelayer'){
                            continue;
                        }

                        for (x = 0; x < fileContent.width; x++) {
                            for (y = 0; y < fileContent.height; y++) {
                                that.mapData[i][x][y] = fileContent.layers[i].data[y * fileContent.width + x]-1;
                            }
                        }
                    }

                    that.palette = new mosaik.Palette({
                        mapImage: fileContent.tilesets[0].image,
                        sizeW: fileContent.tilewidth,
                        sizeH: fileContent.tileheight
                    });

                    if(that.palette.ready){
                        finishInit();
                    } else {
                        that.palette.on('ready', function (){
                            finishInit();
                        });
                    }
                }

            });
        } else {
            //Create a fresh map from scratch
            if(!(params.palette instanceof mosaik.Palette)){
                throw new Error('The palette object needs to be an instance of mosaik.Palette');
            }
            this.palette = params.palette;
            this.prepare(params.width, params.height, params.defaultFieldIndex);
            finishInit();
        }

        function finishInit(){
            if(typeof params.initialize === 'function'){
                params.initialize.call(that);
            }
            that.trigger('ready', that);
        }
    };

    mosaik.Map.prototype = {
        /**
         * THIS FLUSHES ALL EXISTING MAP DATA!
         * Initializes the mapData array and creates one layer per field with the default field index.
         * This is normally called from the constructor and doesn't need to be called again.
         * @param {Number} width
         * @param {Number} height
         * @param {Number} [defaultFillIndex=0]
         */
        prepare: function (width, height, defaultFillIndex){
            var x,
                y,
                row;

            if(defaultFillIndex === undefined){
                defaultFillIndex = 0;
            }

            this.mapData = [
                []
            ];
            this.width = width;
            this.height = height;

            for (x = 0; x < width; x++) {
                row = [];

                for (y = 0; y < height; y++) {
                    row.push(defaultFillIndex);
                }

                this.mapData[0].push(row);
            }
        },

        /**
         * Sets a specific field on a specific layer to a palette index.
         * @param {Object} params
         * @param {Number} params.x
         * @param {Number} params.y
         * @param {Number} [params.layer=0]
         * @param {Number} params.index
         */
        set: function (params){

        },

        /**
         * Performs a flood fill from the given position.
         * @param {{}} params
         * @param {Number} params.x
         * @param {Number} params.y
         * @param {Number} [params.layer=0]
         * @param {Number} params.index
         */
        flood: function (params){

        },

        /**
         * Will return the palette index of the specified field.
         * @param {Number} x
         * @param {Number} y
         * @param {Number} [layer=0]
         */
        get: function (x, y, layer){

        },

        /**
         * Setting the viewport of the map to a field position.
         * The viewport will be rendered at the center of the stage.
         * TODO: implement tweening
         * @param {Number} x
         * @param {Number} y
         * @param {Number} [duration=0] Tween the transition to the new viewport position (in milliseconds)
         */
        setViewport: function (x, y, duration){
            if(!duration){
                this.viewport = [x,y];
                this.trigger('viewportChange', this);
            }
        }
    };

    /**
     * Analyzes the fileContend of a loaded JSON map to determine if its a map saved from the tiled map editor.
     * @param {Object} fileContent
     * @return {Bool}
     */
    mosaik.Map.isTiledMap = function (fileContent){
        return fileContent.height && fileContent.layers && fileContent.orientation && fileContent.properties && fileContent.tileheight && fileContent.tilesets && fileContent.tilewidth && fileContent.version && fileContent.width;
    };

    _.extend(mosaik.Map.prototype, mosaik.Events);

})();