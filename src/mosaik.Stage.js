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

        var stageWidth,         //Width of the canvas in pixels
            stageHeight,        //Height of the canvas in pixels
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
            viewPortXpx,        //Position of the viewport on the map in pixels
            viewPortYpx,
            tileSliceX,         //Position of the tile slice taken from the map in tiles
            tileSliceY,
            tileSliceW,         //Dimension of the tile slice taken from the map in tiles
            tileSliceH,
            tileSliceWpx,       //Dimension of the tile slice taken from the map in pixels
            tileSliceHpx,
            stageXpx,           //Position of the stage relative to the map in pixels
            stageYpx,
            renderOffsetX,      //Render offset in pixels
            renderOffsetY,
            lastTween,          //Time when the last tweening cycle has been done.
            tweenTime,          //Waiting time between tween cycles. Should be 30 times per second to perform smooth animations.
            tweens;             //Array of tween objects to be worked off.


        stageWidth = params.width || 0;
        stageHeight = params.height || 0;
        headless = !!params.headless;
        el = params.el || null;
        tickTime = params.tickTime || 100;
        lastTick = 0;
        ctx = null;
        map = null;
        that = this;
        debugEl = null;
        stats = false;
        lastTween = 0;
        tweenTime = 1000 / 30;
        tweens = [];

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
                stageWidth = el.width = params.width;
                stageHeight = el.height = params.height;
                document.body.appendChild(el);
            } else {
                stageWidth = el.width;
                stageHeight = el.height;
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

            if(map && runTime >= lastTween + tweenTime){
                processTweens(runTime);

                if(!headless && map){
                    render(runTime);
                }
            }
        }

        mosaik.requestAnimationFrame(cycle);

        function processTweens(runTime){
            var i;

            for (i = 0; i < tweens.length; i++) {
                tweens[i].process(runTime);
            }
        }


        function render(runTime){
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

            ctx.clearRect(0, 0, stageWidth, stageHeight);

            for (l = 0; l < mData.length; l++) {
                for (y = tileSliceY; y < tileSliceY + tileSliceH; y++) {
                    for (x = tileSliceX; x < tileSliceX + tileSliceW; x++) {
                        palette.draw(mData[l][x][y], (x-tileSliceX) * tW + renderOffsetX, (y-tileSliceY) * tH + renderOffsetY);
                        //ctx.strokeText(x + ',' + y, x*tW + renderOffsetX + 5, y*tH + renderOffsetY + 5);
                    }
                }
                if(mData.length > 1 && l === mData.length - 2){
                    renderObjects(runTime);
                }
            }

            if(mData.length === 1){
                renderObjects(runTime);
            }

            if(stats){
                stats.end();
            }

        }

        function renderObjects(runTime){
            var i,
                x,
                y,
                o,
                pal,
                tW,
                tH,
                objectLayers;

            objectLayers = map.objectLayers;
            pal = map.palette;
            tW = pal.tileWidth;
            tH = pal.tileHeight;

            for (i = 0; i < objectLayers.length; i++) {
                for (y = tileSliceY; y < tileSliceY + tileSliceH; y++) {
                    for (x = tileSliceX; x < tileSliceX + tileSliceW; x++) {
                        o = objectLayers[i][x][y];

                        if(o === null){
                            continue;
                        }
                        if(o.rendered === runTime){
                            continue;
                        }
                        o.rendered = runTime;
                        o.render(ctx, (x-tileSliceX) * tW + renderOffsetX, (y-tileSliceY) * tH + renderOffsetY);
                    }
                }
            }
        }

        function calculateViewportData(){
            stageXpx = (map.viewport[0] * map.palette.tileWidth) - (stageWidth / 2);
            stageYpx = (map.viewport[1] * map.palette.tileHeight) - (stageHeight / 2);

            tileSliceW = Math.ceil(Math.min(stageWidth / map.palette.tileWidth, map.width));
            tileSliceH = Math.ceil(Math.min(stageHeight / map.palette.tileHeight, map.height));
            tileSliceX = Math.floor(Math.min(stageXpx / map.palette.tileWidth, map.width - tileSliceW));
            tileSliceY = Math.floor(Math.min(stageYpx / map.palette.tileHeight, map.height - tileSliceH));

            tileSliceWpx = tileSliceW * map.palette.tileWidth;
            tileSliceHpx = tileSliceH * map.palette.tileHeight;

            renderOffsetX = -((tileSliceWpx - stageWidth) / 2);
            renderOffsetY = -((tileSliceHpx - stageHeight) / 2);

            console.log('Stage: ', stageXpx, stageYpx, stageWidth, stageHeight);
            console.log(tileSliceX, tileSliceY, tileSliceW, tileSliceH, renderOffsetX, renderOffsetY);
        }

        /**
         * Set a map object to be rendered on the stage.
         * @param {mosaik.Map} mapObject
         */
        this.setMap = function (mapObject){
            if(mapObject instanceof mosaik.Map){
                if(map){
                    map.stopListening();
                    tweens = [];
                }
                mapObject.palette.setDrawContext(ctx);
                map = mapObject;
                this.listenTo(map, 'viewportChange', function (){
                    calculateViewportData();
                });
                calculateViewportData();
                if(map.palette.tileAnimation){
                    tweens.push(map.palette.tileAnimation);
                }
                return;
            }
            throw new Error('Only elements of type mosaik.Map allowed.');
        };

        /**
         * Creates a new tweening object to transform a value.
         * Finished tweens are automatically removed.
         * @param {Object} params
         * @param {Number} params.duration Duration of the tweening process in milliseconds.
         * @param {Number} params.beginValue The starting value of the tween.
         * @param {Number} params.finishValue The end/target value of the tween.
         * @param {String} [params.tweenMode="linear"] What equation should be used for the tween.
         * @param {Function} [params.processFunction] A custom processing function to be used. Overrides tweenMode.
         * @param {Number} [params.frameLimit] Limit the tween to a specific number of frames per second. (Something < 30)
         * @returns {mosaik.Tween}
         */
        this.createTween = function (params){
            var tween = new mosaik.Tween(params);

            tweens.push(tween);

            return tween;
        };
    };

    mosaik.Stage.prototype = {
    };

    _.extend(mosaik.Stage.prototype, mosaik.Events);
})
    ();