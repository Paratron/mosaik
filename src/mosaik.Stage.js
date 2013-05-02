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

        var width,
            height,
            headless,
            noRender,
            el,
            ctx,
            fps,
            that,
            tickTime,
            lastTick,
            tickCount,
            map,
            viewPortX,
            viewPortY,
            viewPortTileX,
            viewPortTileY,
            viewPortTileW,
            viewPortTileH,
            viewPortOffsX,
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
        noRender = false;

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

            this.fps = 0;
            setInterval(function (){
                that.fps = fps;
                fps = 0;
            }, 1000);
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

            mData = map.mapData;
            palette = map.palette;
            tW = palette.tileWidth;
            tH = palette.tileHeight;

            ctx.clearRect(0,0,width,height);

            for (l = 0; l < mData.length; l++) {
                for (x = viewPortTileX; x < viewPortTileW; x++) {
                    for (y = viewPortTileY; y < viewPortTileH; y++) {
                        palette.draw(mData[l][x][y], x * tW + viewPortOffsX, y * tH + viewPortOffsY);
                    }
                }
            }


            fps++;
        }

        function calculateViewportData(){
            viewPortX = map.viewport[0] * map.palette.tileWidth - width / 2;
            viewPortY = map.viewport[1] * map.palette.tileHeight - height / 2;

            if(viewPortX <= 0){
                viewPortTileX = 0;
                viewPortOffsX = -viewPortX;
            } else {
                viewPortTileX = ~~(viewPortX / map.palette.tileWidth);
            }

            if(viewPortY <= 0){
                viewPortTileY = 0;
                viewPortOffsY = -viewPortY;
            } else {
                viewPortTileY = ~~(viewPortY / map.palette.tileHeight);
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
                viewPortTileW = ~~(width / mapObject.palette.tileWidth) + 1;
                viewPortTileH = ~~(height / mapObject.palette.tileHeight) + 1;
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