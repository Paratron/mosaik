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
        this.defaultIndex = null;   //The default index is returned, when a requested map field has not been set.
        this.objectLayers = [];
        this.palette = null;
        this.width = null;
        this.height = null;
        this.viewport = [0, 0];
        this.currentStage = null;
        this.ready = false;

        var that,
            i,
            x,
            y,
            mapPath;

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

            that.ready = true;
            that.trigger('ready', that);
        }

        if(params.file){
            //Load the map data from a JSON file.
            mosaik.getJSON(params.file, function (fileContent){

                if(mosaik.Map.isTiledMap(fileContent)){
                    mapPath = params.file.split('/');
                    mapPath.pop();
                    mapPath = mapPath.join('/');
                    if(mapPath){
                        mapPath += '/';
                    }
                    that.prepare(fileContent.width, fileContent.height, 0);
                    for (i = 0; i < fileContent.layers.length; i++) {
                        if(fileContent.layers[i].type !== 'tilelayer'){
                            continue;
                        }

                        for (x = 0; x < fileContent.width; x++) {
                            for (y = 0; y < fileContent.height; y++) {
                                that.mapData[i][x + ',' + y] = fileContent.layers[i].data[y * fileContent.width + x] - 1;
                            }
                        }
                    }

                    that.palette = new mosaik.Palette({
                        mapImage: mapPath + fileContent.tilesets[0].image,
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
         * Leaving out width and height creates an infinite map.
         * @param {Number} [width]
         * @param {Number} [height]
         * @param {Number} [defaultFillIndex=0]
         */
        prepare: function (width, height, defaultFillIndex){

            if(defaultFillIndex === undefined){
                defaultFillIndex = null;
            }

            this.mapData = [];
            this.width = width || null;
            this.height = height || null;

            this.createTileLayer(defaultFillIndex);
        },

        /**
         * Create a new tilemap layer and fill it with the default index.
         * @param {Number} defaultFillIndex
         * @returns {Number} The index of the newly created layer.
         */
        createTileLayer: function (defaultFillIndex){
            var layer;

            layer = {};

            //top, left, right, bottom
            layer.boundaries = [0, 0, this.width || 0, this.height || 0];
            layer.visible = true;
            layer.type = 0; //Tile Layer
            layer.defaultIndex = defaultFillIndex || null;

            this.mapData.push(layer);

            return this.mapData.length - 1;
        },

        /**
         * The method creates a empty object layer and returns its index.
         * @returns {Number} The index of the newly created layer.
         */
        createObjectLayer: function (){
            var layer;

            layer = {};

            layer.visible = true;
            layer.type = 1;
            layer.objects = [];

            this.mapData.push(layer);

            return this.mapData.length - 1;
        },

        /**
         * Removes a previously created tile layer.
         * Warning: You cannot remove the last existing layer. Use map.prepare() instead.
         * @param {Number} layerIndex
         */
        removeLayer: function (layerIndex){
            if(this.mapData.length <= 1){
                throw new Error('You cannot remove the last layer');
            }

            if(layerIndex < 0 || layerIndex >= this.mapData.length){
                throw new Error('Illegal index');
            }

            this.mapData.splice(layerIndex, 1);
        },

        /**
         * Makes a layer visible (enables it for rendering).
         * @param {Number} layerIndex
         */
        showLayer: function (layerIndex){
            if(layerIndex < 0 || layerIndex >= this.mapData.length){
                throw new Error('Illegal index');
            }

            this.mapData[layerIndex].visible = true;
        },

        /**
         * Makes a layer invisible (disables it for rendering).
         * @param {Number} layerIndex
         */
        hideLayer: function (layerIndex){
            if(layerIndex < 0 || layerIndex >= this.mapData.length){
                throw new Error('Illegal index');
            }

            this.mapData[layerIndex].visible = false;
        },

        getLayer: function (layerIndex){
            return this.mapData[layerIndex];
        },

        /**
         * Place a object on the map or move it around.
         * Will return false if the desired space is occupied.
         * @param {mosaik.Object} obj
         * @param {Number} layerIndex
         * @param {Bool} [noEvent=false] Prevent the method from firing a Map#ObjectMoved or Map#ObjectPlaced event.
         * @return {Bool}
         */
        placeObject: function (obj, layerIndex, noEvent){
            var layer;

            layer = this.getLayer(layerIndex);

            if(layer.type !== 1){
                throw new Error('You cannot place the object on this layer');
            }

            if(layer.objects.indexOf(obj) !== -1){
                throw new Error('Object already on this layer');
            }

            layer.objects.push(obj);

            if(!noEvent){
                this.trigger('ObjectPlaced', obj);
            }
        },

        removeObject: function (obj, layerIndex, noEvent){
            var layer,
                oIndex;

            layer = this.getLayer(layerIndex);

            if(layer.type !== 1){
                throw new Error('Illegal operation');
            }

            oIndex = layer.objects.indexOf(obj);

            if(oIndex !== -1){
                layer.objects.splice(oIndex, 1);
            } else {
                throw new Error('Object not found');
            }

            if(!noEvent){
                this.trigger('ObjectRemoved', obj);
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
            var layer;

            if(params.layer === undefined){
                params.layer = 0;
            }

            layer = this.mapData[params.layer];

            if(layer.type !== 0){
                throw new Error('You can only set tiles on tile layers');
            }

            layer[params.x + ',' + params.y] = params.index;

            layer.boundaries = [
                Math.min(layer.boundaries[0], params.x),
                Math.min(layer.boundaries[1], params.y),
                Math.max(layer.boundaries[2], params.x),
                Math.max(layer.boundaries[3], params.y)
            ];

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
            var layer,
                workIndex,
                fillTiles,
                stackTiles,
                checkedTiles,
                currentTile,
                x,
                y;

            layer = this.getLayer(params.layer || 0);
            workIndex = layer[params.x + ',' + params.y];

            if(params.index === undefined){
                throw new Error('Please define a fill index');
            }

            fillTiles = [];
            stackTiles = [];
            checkedTiles = {};

            if(layer.type !== 0){
                throw new Error('Flood fill can only be performed on a tile layer');
            }

            stackTiles.push([params.x, params.y]);
            fillTiles.push([params.x, params.y]);
            checkedTiles[params.x + ',' + params.y] = true;

            function check(x, y){
                if(x < layer.boundaries[0] || y < layer.boundaries[1] || x > layer.boundaries[2] || y > layer.boundaries[3]){
                    return false;
                }
                return (layer[x + ',' + y] === workIndex && !checkedTiles[x + ',' + y]);
            }

            function push(x, y){
                stackTiles.push([x, y]);
                fillTiles.push([x, y]);
                checkedTiles[x + ',' + y] = true;
            }

            while (stackTiles.length) {
                currentTile = stackTiles.shift();
                x = currentTile[0];
                y = currentTile[1];

                if(check(x - 1, y)){
                    push(x - 1, y);
                }

                if(check(x + 1, y)){
                    push(x + 1, y);
                }

                if(check(x, y - 1)){
                    push(x, y - 1);
                }

                if(check(x, y + 1)){
                    push(x, y + 1);
                }
            }

            for (x = 0; x < fillTiles.length; x++) {
                y = fillTiles[x];
                layer[y[0] + ',' + y[1]] = params.index;
            }

            return this;
        },

        /**
         * Will return the palette index of the specified field.
         * @param {Number} x
         * @param {Number} y
         * @param {Number} [layer=0]
         */
        get: function (x, y, layer){
            var value;

            layer = layer || 0;

            if(this.width || this.height){
                if(x < 0 || y < 0 || x > this.with || y > this.height){
                    throw new Error('Out of bounds');
                }
            }

            if(this.mapData[layer].type !== 0){
                throw new Error('You can perform get() only on a tile layer');
            }

            value = this.mapData[layer][x + ',' + y];

            return value !== undefined ? value : null;
        },

        getWidth: function (){
            var i,
                x,
                x2;

            x = Number.POSITIVE_INFINITY;
            x2 = 0;

            for (i = 0; i < this.mapData.length; i++) {
                x = Math.min(x, this.mapData[i].boundaries[0]);
                x2 = Math.max(x2, this.mapData[i].boundaries[2]);
            }

            return Math.abs(x - x2);
        },

        getHeight: function (){
            var i,
                y,
                y2;

            y = Number.POSITIVE_INFINITY;
            y2 = 0;

            for (i = 0; i < this.mapData.length; i++) {
                y = Math.min(y, this.mapData[i].boundaries[1]);
                y2 = Math.max(y2, this.mapData[i].boundaries[3]);
            }

            return Math.abs(y - y2);
        },

        /**
         * Will return an array of tile coordinates that marks the path from tile A to tile B.
         * When avoidTiles is given, the tile types from the array are avoided by the path.
         * The method will return boolean false if no path is possible.
         * TODO: fix this
         * @param {Number} layer
         * @param {Number} fromX
         * @param {Number} fromY
         * @param {Number} toX
         * @param {Number} toY
         * @param {Array} [avoidTiles] Optional array of palette indexes to avoid.
         * @return {Array|false}
         */
        getPath: function (layer, fromX, fromY, toX, toY, avoidTiles){
            var field,
                openList,
                closedList,
                currentNode;

            field = this.mapData[layer];
            avoidTiles = avoidTiles || [];
            openList = [];
            closedList = [];

            function manhattanDistance(x1, y1, x2, y2){
                return Math.abs(x2 - x1) + Math.abs(y2 - y1);
            }

            /**
             * Returns the Node with the best score.
             * @returns {Mixed}
             */
            function shiftMinNode(){
                var node;

                _.sortBy(openList, function (n){
                    return n.g + n.h;
                });

                node = openList.shift();

                return node;
            }

            function closeNode(node){
                if(closedList[node.x] === undefined){
                    closedList[node.x] = [];
                }
                closedList[node.x][node.y] = true;
            }

            function isClosed(node){
                if(closedList[node.x] === undefined){
                    return false;
                }
                return closedList[node.x][node.y];
            }

            function isOpen(node){
                return _.find(openList, function (n){
                    return n.x === node.x && n.y === node.y;
                });
            }

            function getPath(node){
                var path;

                path = [];

                while (node.parent) {
                    path.push({
                        x: node.x,
                        y: node.y
                    });
                    node = node.parent;
                }

                path.push({
                    x: node.x,
                    y: node.y
                });

                path.shift();

                return path;
            }

            function getNode(x, y, parent, target){
                if(x < field.boundaries[0] || y < field.boundaries[1] || y >= field.boundaries[2] || x >= field.boundaries[3]){
                    return;
                }

                if(closedList[x] && closedList[x][y]){
                    return;
                }

                if(avoidTiles.indexOf(field[x + ',' + y]) !== -1){
                    return;
                }

                target.push({x: x, y: y, g: parent.g + 1, h: manhattanDistance(x, y, fromX, fromY)});
            }

            function expand(node){
                var neighbors,
                    neighbor,
                    n,
                    nOpen,
                    key,
                    tG;

                neighbors = [];

                getNode(node.x, node.y - 1, node, neighbors);
                getNode(node.x - 1, node.y, node, neighbors);
                getNode(node.x + 1, node.y, node, neighbors);
                getNode(node.x, node.y + 1, node, neighbors);

                for (key in neighbors) {
                    neighbor = neighbors[key];
                    tG = node.g + 1;

                    if(isClosed(neighbor) && tG >= neighbor.g){
                        continue;
                    }

                    n = isOpen(neighbor);
                    if(!n || tG < neighbor.g){
                        nOpen = true;
                        if(!n){
                            n = neighbor;
                            nOpen = false;
                        }
                        n.parent = node;
                        n.g = tG;
                        if(!nOpen){
                            openList.push(n);
                        }
                    }
                }
            }


            if(avoidTiles && avoidTiles.indexOf(field[toX + ',' + toY]) !== -1){
                return [];
            }

            openList.push({
                x: toX,
                y: toY,
                g: 0,
                h: manhattanDistance(toX, toY, fromX, fromY)
            });

            while (openList.length) {
                currentNode = shiftMinNode();

                if(currentNode.x === fromX && currentNode.y === fromY){
                    return getPath(currentNode);
                }

                closeNode(currentNode);

                expand(currentNode);
            }

            return [];
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
     * Analyzes the fileContent of a loaded JSON map to determine if its a map saved from the tiled map editor.
     * @param {Object} fileContent
     * @return {Bool}
     */
    mosaik.Map.isTiledMap = function (fileContent){
        return fileContent.height && fileContent.layers && fileContent.orientation && fileContent.properties && fileContent.tileheight && fileContent.tilesets && fileContent.tilewidth && fileContent.version && fileContent.width;
    };

    _.extend(mosaik.Map.prototype, mosaik.Events);

})();