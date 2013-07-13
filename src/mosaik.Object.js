/**
 * Mosaik Object
 * =============
 * A mosaik object is the most basic element to be rendered on a object layer.
 */
(function (){
    'use strict';

    var mosaik;
    if(typeof window === 'undefined'){
        mosaik = exports || require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    mosaik.Object = function (params){
        this.id = Math.random().toString().split('.').pop();
        this.x = params.x || null;
        this.y = params.y || null;
        this.width = params.width || 0;
        this.height = params.height || 0;
        this.offsX = params.offsX || 0;
        this.offsY = params.offsY || 0;
        this.layer = params.layer || 0;
        this.visible = params.visible !== undefined ? params.visible : true;
        this.rendered = 0; //Will be used by the Stages rendering function to check if the object has been rendered during a render process.

        this.map = params.map;
        if(!(this.map instanceof mosaik.Map)){
            throw new Error('Need to get passed a reference to the containing map');
        }

        this.palette = params.palette;
        if(!(this.palette instanceof mosaik.Palette)){
            throw new Error('Need to get passed a reference to the sprite palette used for drawing');
        }

        this.paletteIndex = params.paletteIndex || 0;
    };

    mosaik.Object.prototype = {
        /**
         * Will place the object on a new position on the map.
         * @param x
         * @param y
         * @param duration
         */
        move: function (x, y, duration){
            var oldX,
                oldY;

            oldX = this.x;
            oldY = this.y;

            if(!duration){
                this.x = x;
                this.y = y;
                this.map.placeObject(this.layer, this, x, y, oldX, oldY);
                this.trigger('move', x, y, oldX, oldY);
            }
        },

        /**
         * This method is called by the Stage to tell the object where to render its graphical asset.
         * @param {CanvasRenderingContext2D} canvasContext
         * @param {Number} x X-Position to draw on, in pixels
         * @param {Number} y Y-Position to draw on, in pixels
         * @param {Object} debugDrawing Configuration object for potentially debug drawings
         */
        render: function(canvasContext, x, y, debugDrawing){
            this.palette.setDrawContext(canvasContext);
            this.palette.draw(this.paletteIndex, x, y, {});
            if(debugDrawing.objectOutlines){
                canvasContext.save();
                canvasContext.beginPath();
                canvasContext.strokeStyle = debugDrawing.objectOutlines;
                canvasContext.lineWidth = 1;
                canvasContext.rect(x + 0.5, y + 0.5, this.palette.tileWidth * this.width, this.palette.tileHeight * this.height);
                canvasContext.stroke();
                canvasContext.restore();
            }
        }
    };

    _.extend(mosaik.Object.prototype, mosaik.Events);
})();