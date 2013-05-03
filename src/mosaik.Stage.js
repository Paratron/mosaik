/**
 * Mosaik Stage Object
 * ===================
 * The stage object is the base game container.
 * Its directly associated to the canvas element and coordinates the user input and engine output.
 */
(function (){
    'use strict';

    var mosaik;
    if(typeof window === 'undefined'){
        mosaik = require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    mosaik.Stage = function (params){
        params = params || {};

        var width,              //Width of the canvas
            height,             //Height of the canvas
            headless,           //Headless mode? (no graphical output)
            el,                 //Reference to the canvas element
            debugEl,            //Reference to the DOM node that displays debugging information
            stats,              //Reference to the stats.js object (https://github.com/mrdoob/stats.js/)
            ctx,                //Reference to the canvas context
            that,               //Reference to this for callbacks
            tickTime,           //Duration of a tick in milliseconds
            lastTick,           //Timestamp of the last tick
            tickCount,          //Number of ticks so far
            map,                //Reference to a mosaik.map object
            viewPortX,          //TopLeft position of the canvas window relative to the map in pixels
            viewPortY,
            viewPortTileX,      //TopLeft tile position of the canvas window relative to the map
            viewPortTileY,
            viewPortTileW,      //Width of the canvas window in tiles
            viewPortTileH,
            viewPortOffsX,      //Rendering offset in pixels (i.E. when map is smaller than canvas)
            viewPortOffsY;


        width = params.width || 0;
        height = params.height || 0;
        headless = !!params.headless;
        el = params.el || null;
        tickTime = params.tickTime || 100;
        lastTick = 0;
        ctx = null;
        map = null;
        viewPortX = viewPortY = viewPortOffsX = viewPortOffsY = 0;
        that = this;
        debugEl = null;
        stats = false;

        //When running in non-browser context, only the headless mode is available.
        if(typeof window === 'undefined'){
            headless = true;
        }

        if(!headless){
            if(typeof el === 'string'){
                el = document.getElementById(el);
            }

            //Check if the canvas is given, or has to be created.
            if(el.nodeName !== 'CANVAS'){
                el = document.createElement('canvas');
                width = el.width = params.width;
                height = el.height = params.height;
                document.body.appendChild(el);
            } else {
                width = el.width;
                height = el.height;
            }

            ctx = el.getContext('2d');

            if(params.debug){
                if(window.Stats === undefined){
                    throw new Error('For debugging, the stats.js lib needs to be present.');
                }
                debugEl = document.getElementById(params.debug);
                stats = new window.Stats();
                debugEl.appendChild(stats.domElement);
            }
        }

        //Register our own render cycle on mosaiks RAF function.
        function cycle(runTime){
            mosaik.requestAnimationFrame(cycle);

            if(map && runTime >= lastTick + tickTime){
                tickCount++;
                map.trigger('tick', tickCount);
                lastTick = runTime;
            }

            if(!headless && map){
                render();
            }
        }

        mosaik.requestAnimationFrame(cycle);

        function render(){
            var mData,
                palette,
                x,
                y,
                tW,
                tH,
                l;

            if(stats){
                stats.begin();
            }

            mData = map.mapData;
            palette = map.palette;
            tW = palette.tileWidth;
            tH = palette.tileHeight;

            ctx.clearRect(0, 0, width, height);

            for (l = 0; l < mData.length; l++) {
                for (y = viewPortTileY; y < viewPortTileH; y++) {
                    for (x = viewPortTileX; x < viewPortTileW; x++) {
                        palette.draw(mData[l][x][y], x * tW + viewPortOffsX, y * tH + viewPortOffsY);
                    }
                }
                if(mData.length > 1 && l === mData.length - 2){
                    renderObjects();
                }
            }

            if(mData.length === 1){
                renderObjects();
            }

            if(stats){
                stats.end();
            }

        }

        function renderObjects(){

        }

        function calculateViewportData(){
            viewPortX = map.viewport[0] * map.palette.tileWidth - width / 2;
            viewPortY = map.viewport[1] * map.palette.tileHeight - height / 2;

            if(viewPortX <= 0){
                viewPortTileX = 0;
                viewPortOffsX = -viewPortX;
            } else {
                viewPortTileX = Math.floor(viewPortX / map.palette.tileWidth);
            }

            if(viewPortY <= 0){
                viewPortTileY = 0;
                viewPortOffsY = -viewPortY;
            } else {
                viewPortTileY = Math.floor(viewPortY / map.palette.tileHeight);
            }
        }

        /**
         * Set a map object to be rendered on the stage.
         * @param {mosaik.Map} mapObject
         */
        this.setMap = function (mapObject){
            if(mapObject instanceof mosaik.Map){
                if(map){
                    map.stopListening();
                }
                mapObject.palette.setDrawContext(ctx);
                viewPortTileW = Math.floor(width / mapObject.palette.tileWidth) + 1;
                viewPortTileH = Math.floor(height / mapObject.palette.tileHeight) + 1;
                if(viewPortTileW > mapObject.width){
                    viewPortTileW = mapObject.width;
                }
                if(viewPortTileH > mapObject.height){
                    viewPortTileH = mapObject.height;
                }
                map = mapObject;
                this.listenTo(map, 'viewportChange', function (){
                    calculateViewportData();
                });
                calculateViewportData();
                return;
            }
            throw new Error('Only elements of type mosaik.Map allowed.');
        };
    };

    mosaik.Stage.prototype = {

    };

    _.extend(mosaik.Stage.prototype, mosaik.Events);
})();