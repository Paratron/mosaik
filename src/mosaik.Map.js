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
        mosaik = exports || require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    mosaik.Map = function (params){
        params = params || {};

        this.mapData = null;
        this.objectLayers = [];
        this.palette = null;
        this.width = 0;
        this.height = 0;

        var that,
            i,
            x,
            y;

        that = this;

        function finishInit(){
            var pointerStore;

            if(typeof params.initialize === 'function'){
                params.initialize.call(that);
            }

            pointerStore = [];

            that.on('pointerdown pointerup', function (e){
                var i,
                    j;

                if(e.type === 'pointerdown'){
                    for (i = 0; i < e.pointers.length; i++) {
                        pointerStore.push(e.pointers[i]);
                    }
                    return;
                }

                for (j = 0; j < e.pointers.length; j++) {
                    for (i = 0; i < pointerStore.length; i++) {
                        if(pointerStore[i].id === e.pointers[j].id){
                            if(pointerStore[i].tileX === e.pointers[j].tileX && pointerStore[i].tileY === e.pointers[j].tileY){
                                e.type = 'pointertap';
                                that.trigger('pointertap', e);
                            }
                            pointerStore.splice(i, 1);
                            break;
                        }
                    }
                }
            });

            that.trigger('ready', that);
        }

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
                                that.mapData[i][x][y] = fileContent.layers[i].data[y * fileContent.width + x] - 1;
                            }
                        }
                    }

                    that.palette = new mosaik.Palette({
                        mapImage: fileContent.tilesets[0].image,
                        sizeW: fileContent.tilewidth,
                        sizeH: fileContent.tileheight,
                        animate: fileContent.tilesets[0].animate
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
         * The method creates a empty object layer and returns it.
         * @returns {Array}
         */
        createObjectLayer: function (){
            var x,
                y,
                oLayer;

            oLayer = [];

            for (x = 0; x < this.width; x++) {
                oLayer.push([]);
                for (y = 0; y < this.height; y++) {
                    oLayer[x].push(null);
                }
            }

            this.objectLayers.push(oLayer);

            return oLayer;
        },

        /**
         * Place a object on the map or move it around.
         * Will return false if the desired space is occupied.
         * @param {Number} layer
         * @param {mosaik.Object} obj
         * @param {Number} x
         * @param {Number} y
         * @param {Number} [oldX]
         * @param {Number} [oldY]
         * @param {Bool} [noEvent=false] Prevent the method from firing a Map#ObjectMoved or Map#ObjectPlaced event.
         * @return {Bool}
         */
        placeObject: function (layer, obj, x, y, oldX, oldY, noEvent){
            var ocupX,
                ocupY;

            while (layer + 1 > this.objectLayers.length) {
                this.createObjectLayer();
            }

            if(!this.objectHitTest(layer, x, y, obj.width, obj.height, obj)){
                if(oldX && oldY){
                    this.removeObject(obj, oldX, oldY, true);
                }

                for (ocupX = x; ocupX <= x + obj.width - 1; ocupX++) {
                    for (ocupY = y; ocupY <= y + obj.height - 1; ocupY++) {
                        this.objectLayers[layer][ocupX][ocupY] = obj;
                    }
                }
                obj.rendered = 0;
                obj.x = x;
                obj.y = y;
                obj.layer = layer;

                if(oldX && oldY && !noEvent){
                    this.trigger('ObjectMoved', obj);
                    return true;
                }
                if(!noEvent){
                    this.trigger('ObjectPlaced', obj);
                }
                return true;
            }
            return false;
        },

        removeObject: function (obj, x, y, noEvent){
            var freeX,
                freeY;

            for (freeX = x; freeX < x + obj.width - 1; freeX++) {
                for (freeY = y; freeY < y + obj.width - 1; freeY++) {
                    this.objectLayers[obj.layer][freeX][freeY] = null;
                }
            }

            obj.x = null;
            obj.y = null;
            obj.layer = null;

            if(!noEvent){
                this.trigger('ObjectRemoved', obj);
            }
        },

        /**
         * Checks if the given space is occupied on a specific object layer.
         * @param {Number} layer
         * @param {Number} x
         * @param {Number} y
         * @param {Number} [w=1]
         * @param {Number} [h=1]
         * @param {mosaik.Object} [ignoreObj] A mosaik object to ignore upon the hit-test.
         * @returns {Bool}
         */
        objectHitTest: function (layer, x, y, w, h, ignoreObj){
            var wI,
                hI,
                l;

            w = w || 1;
            h = h || 1;

            l = this.objectLayers[layer];

            for (wI = x; wI < x + w - 1; wI++) {
                for (hI = y; hI < y + h - 1; hI++) {
                    if(l[wI][hI] !== null){
                        if(!ignoreObj || ignoreObj.id !== l[wI][hI].id){
                            return true;
                        }
                    }
                }
            }
            return false;
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
            if(params.layer === undefined){
                params.layer = 0;
            }

            this.mapData[params.layer][params.x][params.y] = params.index;

            return this;
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
         * @param {Bool} [noEvent]
         */
        setViewport: function (x, y, duration, noEvent){
            if(!duration){
                this.viewport = [x, y];
                if(!noEvent){
                    this.trigger('viewportChange', this);
                }
            } else {

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