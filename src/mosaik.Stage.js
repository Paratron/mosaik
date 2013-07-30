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
        mosaik = exports || require('mosaik');
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
            tweens,             //Array of tween objects to be worked off.
            inputObserver,      //Instance of mosaik.Input to capture user generated events.
            lastClickedTile,    //Point Object with the coordinates of the last clicked tile.
            highlightedTiles;   //Array of tiles to be highlighted.


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
        inputObserver = null;
        lastClickedTile = null;
        highlightedTiles = null;
        this.debugDrawing = params.debugDrawing || {};

        this.tweenTime = tweenTime;
        //canvasContext, tileSliceX, tileSliceY, tileSliceW, tileSliceH, tileWidth, tileHeight, renderOffsetX, renderOffsetY
        this.hookPreFrame = function (){
        };
        this.hookPostFrame = function (){
        };

        //layerIndex, canvasContext, tileSliceX, tileSliceY, tileSliceW, tileSliceH, tileWidth, tileHeight, renderOffsetX, renderOffsetY
        this.hookPostLayer = function (){
        };

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
                params.el.appendChild(el);
            } else {
                stageWidth = el.width;
                stageHeight = el.height;
            }

            ctx = el.getContext('2d');

            //ctx.translate(0.5, 0.5);

            if(params.debug){
                if(window.Stats === undefined){
                    throw new Error('For debugging, the stats.js lib needs to be present.');
                }
                debugEl = document.getElementById(params.debug);
                stats = new window.Stats();
                debugEl.appendChild(stats.domElement);
            }
        }

        /**
         * This is basically the "main loop" of the game.
         * Its called up to 60 times every second and delegates calls to the tween processor and rendering routines
         * from there.
         * Calls to the tween processor, as well as tick events are NOT issued at 60fps, but get their own
         * call rate. For tweens, this is 30 calls/second by default, ticks are issued every 100ms by default.
         * @param runTime
         */
        function cycle(runTime){

            mosaik.requestAnimationFrame(cycle);

            if(!map){
                return;
            }

            if(runTime >= lastTick + tickTime){
                tickCount++;
                map.trigger('tick', tickCount);
                lastTick = runTime;
            }

            if(runTime >= lastTween + tweenTime){
                processTweens(runTime);
            }

            if(!headless){
                render(runTime);
            }
        }

        mosaik.requestAnimationFrame(cycle);

        /**
         * This walks over all registered tween objects and calls their process() method to continue value tweening.
         * Is called from within the cycle() function.
         * @param runTime
         */
        function processTweens(runTime){
            var i,
                tween;

            for (i = 0; i < tweens.length; i++) {
                tween = tweens[i];
                if(tween.finished){
                    tweens.splice(i, 1);
                    continue;
                }
                tween.process(runTime);
            }
        }

        /**
         * Renders all tile layers and will call the renderObjects() function, if necessary.
         * Is called from within the cycle() function.
         * @param {Number} runTime
         */
        function render(runTime){
            var mData,
                palette,
                x,
                y,
                xPos,
                yPos,
                tW,
                tH,
                l,
                debugDrawing;

            if(stats){
                stats.begin();
            }

            mData = map.mapData;
            palette = map.palette;
            tW = palette.tileWidth;
            tH = palette.tileHeight;
            debugDrawing = that.debugDrawing;

            that.hookPreFrame(ctx, tileSliceX, tileSliceY, tileSliceW, tileSliceH, tW, tH, renderOffsetX, renderOffsetY);

            for (l = 0; l < mData.length; l++) {
                if(!mData[l].visible){
                    continue;
                }
                if(mData[l].type === 1){
                    renderObjects(mData[l]);
                    continue;
                }
                for (y = tileSliceY; y < tileSliceY + tileSliceH; y++) {
                    for (x = tileSliceX; x < tileSliceX + tileSliceW; x++) {
                        if(mData[l][x + ',' + y] === null){
                            continue;
                        }
                        xPos = (x - tileSliceX) * tW + renderOffsetX;
                        yPos = (y - tileSliceY) * tH + renderOffsetY;
                        palette.draw(mData[l][x + ',' + y], xPos, yPos, debugDrawing);
                        //ctx.strokeText(x + ',' + y, (x - tileSliceX)*tW + renderOffsetX + 5, (y - tileSliceY)*tH + renderOffsetY - 10);
                        //ctx.strokeRect((x - tileSliceX)*tW + renderOffsetX, (y - tileSliceY)*tH + renderOffsetY, 32, 32);
                    }
                }
                that.hookPostLayer(l, ctx, tileSliceX, tileSliceY, tileSliceW, tileSliceH, tW, tH, renderOffsetX, renderOffsetY);
            }

            that.hookPostFrame(ctx, tileSliceX, tileSliceY, tileSliceW, tileSliceH, tW, tH, renderOffsetX, renderOffsetY);

            if(debugDrawing.lastClickedTile && lastClickedTile){
                ctx.save();
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = debugDrawing.lastClickedTile;
                ctx.rect((lastClickedTile.x - tileSliceX) * tW + renderOffsetX, (lastClickedTile.y - tileSliceY) * tH + renderOffsetY + 0.5, tW, tH);
                ctx.fill();
                ctx.restore();
            }

            if(debugDrawing.debugFieldHighlight && highlightedTiles){
                ctx.save();
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = debugDrawing.debugFieldHighlight;
                for (l in highlightedTiles) {
                    ctx.rect((highlightedTiles[l].x - tileSliceX) * tW + renderOffsetX, (highlightedTiles[l].y - tileSliceY) * tH + renderOffsetY + 0.5, tW, tH);
                }
                ctx.fill();
                ctx.restore();
            }

            if(stats){
                stats.end();
            }

        }

        /**
         * Renders all elements from the object layer(s).
         * Is called from within the render() function.
         * The runTime parameter is passed to the objects to avoid multiple rendering of objects that occupy more than
         * one tile.
         * @param {Number} runTime
         */
        function renderObjects(objectLayer){

            var filtered,
                o,
                i,
                tW,
                tH,
                pal,
                debugDrawing,
                xPos,
                yPos;

            filtered = [];
            pal = map.palette;
            tW = pal.tileWidth;
            tH = pal.tileHeight;
            debugDrawing = that.debugDrawing;

            for (i = 0; i < objectLayer.objects.length; i++) {
                o = objectLayer.objects[i];

                if(o.x < tileSliceX || o.y < tileSliceY || o.x > tileSliceX + tileSliceW || o.y > tileSliceY + tileSliceH){
                    continue;
                }

                filtered.push(o);
            }

            filtered.sort(function (a, b){
                if(a.y > b.y){
                    return -1;
                }
                if(a.y < b.y){
                    return 1;
                }
                return 0;
            });

            for (i = 0; i < filtered.length; i++) {
                o = filtered[i];

                xPos = (o.x - tileSliceX) * tW + renderOffsetX + o.offsX + o.dynOffsX;
                yPos = (o.y - tileSliceY) * tH + renderOffsetY + o.offsY + o.dynOffsY;

                o.render(ctx, xPos, yPos, debugDrawing);
            }
        }

        /**
         * Calculate the the current range of the tile slice to be taken from the map object and rendered to screen.
         * It also calculates the render-offset to use.
         * Basically everything that can be cached after a call to setViewport() on the map or a change of stage dimensions.
         */
        function calculateViewportData(){
            var traditional;

            if(!map){
                return;
            }

            traditional = (map.height || map.width) ? true : false;

            stageXpx = (map.viewport[0] * map.palette.tileWidth) - (stageWidth / 2);
            stageYpx = (map.viewport[1] * map.palette.tileHeight) - (stageHeight / 2);

            if(traditional){
                tileSliceW = Math.ceil(Math.min(stageWidth / map.palette.tileWidth, map.width));
                tileSliceH = Math.ceil(Math.min(stageHeight / map.palette.tileHeight, map.height));
                tileSliceX = Math.floor(Math.min(stageXpx / map.palette.tileWidth, map.width - tileSliceW));
                tileSliceY = Math.floor(Math.min(stageYpx / map.palette.tileHeight, map.height - tileSliceH));

                if(tileSliceX < 0){
                    tileSliceX = 0;
                }
                if(tileSliceY < 0){
                    tileSliceY = 0;
                }
            }
            else {
                tileSliceW = Math.ceil(stageWidth / map.palette.tileWidth);
                tileSliceH = Math.ceil(stageHeight / map.palette.tileHeight);
                tileSliceX = Math.floor(stageXpx / map.palette.tileWidth);
                tileSliceY = Math.floor(stageYpx / map.palette.tileHeight);
            }

            tileSliceWpx = tileSliceW * map.palette.tileWidth;
            tileSliceHpx = tileSliceH * map.palette.tileHeight;

            renderOffsetX = -((tileSliceWpx - stageWidth) / 2);
            renderOffsetY = -((tileSliceHpx - stageHeight) / 2);
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
                mapObject.currentStage = this;
                this.listenTo(map, 'viewportChange', function (){
                    calculateViewportData();
                });
                calculateViewportData();
                if(map.palette.tileAnimation){
                    tweens.push(map.palette.tileAnimation);
                }
                this.trigger('mapChange', map);
                return;
            }
            throw new Error('Only elements of type mosaik.Map allowed.');
        };

        /**
         * Returns the currently set map object.
         * @returns {mosaik.Map|null}
         */
        this.getMap = function (){
            return map;
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

        /**
         * This enables user input capturing of the stage element.
         * If a map is attached to the stage, the stage will try to figure out which fields and/or objects are affected
         * by pointer events and trigger according events on the map.
         */
        this.captureInput = function (){
            if(inputObserver){
                throw new Error('Input is already captured');
            }

            inputObserver = new mosaik.Input({el: el});
            this.input = inputObserver;

            inputObserver.on('pointerdown pointerup pointermove pointertap', function (e){
                var i,
                    p,
                    tW,
                    tH,
                    traditional;

                if(!map){
                    return;
                }

                tW = map.palette.tileWidth;
                tH = map.palette.tileHeight;
                traditional = (map.height || map.width) ? true : false;

                for (i = 0; i < e.pointers.length; i++) {
                    p = e.pointers[i];

                    p.tileX = Math.floor((p.x - renderOffsetX) / tW) + tileSliceX;
                    p.tileY = Math.floor((p.y - renderOffsetY) / tH) + tileSliceY;

                    if(traditional && (p.tileX < 0 || p.tileX >= map.width || p.tileY < 0 || p.tileY >= map.height)){
                        e.pointers.splice(i, 1);
                        if(!e.pointers.length){
                            return;
                        }
                        continue;
                    }

                    if(i === 0 && e.type === 'pointerup'){
                        lastClickedTile = {
                            x: p.tileX,
                            y: p.tileY
                        };
                    }

                    //Trigger tile-targeted pointer events, so a dev can simply listen to a
                    //specific pointer event directly on a tile coordinate.
                    map.trigger(e.type + ':' + p.tileX + ',' + p.tileY, e);
                }

                //Trigger the complete event.
                map.trigger(e.type, e);
            });
        };

        /**
         * Re-Sets the canvas dimensions and triggers all necessary following calculations.
         * @param {Number} width
         * @param {Number} height
         */
        this.setDimensions = function (width, height){
            el.width = width;
            el.height = height;
            stageWidth = width;
            stageHeight = height;
            calculateViewportData();
        };

        /**
         * Sets an array of point objects with field coordinates to be highlighted.
         * Set debugDrawing.debugFieldHighlight of the stage to the desired color.
         * @param {Array} fieldsArray
         */
        this.debugHighlightFields = function (fieldsArray){
            highlightedTiles = (fieldsArray && fieldsArray.length) ? fieldsArray : null;
        };
    };

    mosaik.Stage.prototype = {
    };

    _.extend(mosaik.Stage.prototype, mosaik.Events);
})
    ();