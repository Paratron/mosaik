/**
 * Mosaik Input
 * ============
 * Used to handle user inputs.
 * Provided features:
 *
 * - Handle keyboard events globally
 * - Handle mouse click and move events globally
 * - Handle touch events globally
 * - Providing a game-object extension so they can react on clicks/touches/moves on them.
 *
 */
(function (){
    'use strict';

    var mosaik;
    if(typeof window === 'undefined'){
        mosaik = exports || require('mosaik');
    } else {
        mosaik = window.mosaik;
    }

    function getOffset(el){
        var _x = 0;
        var _y = 0;
        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            _x += el.offsetLeft - el.scrollLeft;
            _y += el.offsetTop - el.scrollTop;
            el = el.offsetParent;
        }
        return { y: _y, x: _x };
    }

    mosaik.Input = function (params){
        var el,
            ongoingTouches,
            that;

        el = params.el;
        that = this;
        ongoingTouches = [];

        el.addEventListener('mousedown', function (e){
            var elPos;

            e.preventDefault();
            e.stopPropagation();
            elPos = getOffset(el);

            that.trigger('pointerdown', {
                type: 'pointerdown',
                pointers: [
                    {
                        x: e.clientX - elPos.x,
                        y: e.clientY - elPos.y,
                        id: null
                    }
                ],
                button: e.button,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            });
        }, false);

        el.addEventListener('mouseup', function (e){
            var elPos;

            e.preventDefault();
            e.stopPropagation();
            elPos = getOffset(el);

            that.trigger('pointerup', {
                type: 'pointerup',
                pointers: [
                    {
                        x: e.clientX - elPos.x,
                        y: e.clientY - elPos.y,
                        id: null
                    }
                ],
                button: e.button,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            });
        }, false);

        el.addEventListener('mousemove', function (e){
            var elPos;

            e.preventDefault();
            e.stopPropagation();
            elPos = getOffset(el);

            that.trigger('pointermove', {
                type: 'pointermove',
                pointers: [
                    {
                        x: e.clientX - elPos.x,
                        y: e.clientY - elPos.y,
                        id: null
                    }
                ],
                button: e.button,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            });
        }, false);

        //==============================================================================================================
        //TOUCH EVENTS
        //==============================================================================================================

        el.addEventListener('touchstart', function (e){
            var elPos,
                touches,
                i,
                pointers;

            e.preventDefault();
            e.stopPropagation();
            elPos = getOffset(el);

            touches = e.changedTouches;
            pointers = [];

            for (i = 0; i < touches.length; i++) {
                ongoingTouches.push(touches[i]);
            }

            for (i = 0; i < ongoingTouches.length; i++) {
                pointers.push({
                    x: ongoingTouches[i].clientX - elPos.x,
                    y: ongoingTouches[i].clientY - elPos.y,
                    id: ongoingTouches[i].identifier
                });
            }

            that.trigger('pointerdown', {
                type: 'pointerdown',
                pointers: pointers,
                button: null,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            });
        }, false);

        function touchEnd(e){
            var elPos,
                touches,
                i,
                j,
                pointers;

            e.preventDefault();
            e.stopPropagation();
            elPos = getOffset(el);

            touches = e.changedTouches;
            pointers = [];

            for (i = 0; i < touches.length; i++) {
                for (j = 0; j < ongoingTouches.length; j++) {
                    if(ongoingTouches[j].identifier === touches[i].identifier){
                        ongoingTouches.splice(j, 1);
                        break;
                    }
                }
            }

            for (i = 0; i < touches.length; i++) {
                pointers.push({
                    x: touches[i].clientX - elPos.x,
                    y: touches[i].clientY - elPos.y,
                    id: touches[i].identifier
                });
            }

            that.trigger('pointerup', {
                type: 'pointerup',
                pointers: pointers,
                button: null,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            });
        }

        el.addEventListener('touchend', touchEnd, false);
        el.addEventListener('touchcancel', touchEnd, false);

        el.addEventListener('touchmove', function (e){
            var elPos,
                touches,
                i,
                j,
                pointers;

            e.preventDefault();
            e.stopPropagation();
            elPos = getOffset(el);

            touches = e.changedTouches;
            pointers = [];

            for (i = 0; i < touches.length; i++) {
                for (j = 0; j < ongoingTouches.length; j++) {
                    if(ongoingTouches[j].identifier === touches[i].identifier){
                        ongoingTouches[j] = touches[i];
                        break;
                    }
                }
            }

            for (i = 0; i < ongoingTouches.length; i++) {
                pointers.push({
                    x: ongoingTouches[i].clientX - elPos.x,
                    y: ongoingTouches[i].clientY - elPos.y,
                    id: ongoingTouches[i].identifier
                });
            }

            that.trigger('pointermove', {
                type: 'pointermove',
                pointers: pointers,
                button: null,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            });
        }, false);
    };

    _.extend(mosaik.Input.prototype, mosaik.Events);
})();