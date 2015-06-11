(function( $ ) {

    /**
     * Underscore.js 1.5.2
     * http://underscorejs.org
     * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Underscore may be freely distributed under the MIT license.
     */
    function debounce (func, wait, immediate) {
        var timeout, args, context, timestamp, result;
        return function() {
            context = this;
            args = arguments;
            timestamp = new Date();
            var later = function() {
                var last = (new Date()) - timestamp;
                if (last < wait) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    if (!immediate) result = func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
            if (callNow) result = func.apply(context, args);
            return result;
        };
    }

    $.fn.scrollsnap = function( options ) {

        var settings = $.extend( {
            'snapOnScrollDirection': false,
            'direction': 'y',            
            'snaps' : '*',
            'proximity' : 12,
            'offset' : 0,
            'duration' : 200,
            'latency' : 250,
            'easing' : 'swing',
            'onSnapEvent' : 'scrollsnap', // triggered on the snapped DOM element
            'onSnap' : function ($snappedElement, silent) { }, // callback when an element was snapped
            'onSnapWait' : 50 // wait for redundant snaps before firing event / calling callback
        }, options);

        var leftOrTop = settings.direction === 'x' ? 'Left' : 'Top',
            offsetLT = 'offset' + leftOrTop,
            scrollLT = 'scroll' + leftOrTop;

        return this.each(function() {

            var scrollingEl = this,
                $scrollingEl = $(this);

            if (scrollingEl.nodeType == 1) {
                // scrollingEl is DOM element

                $scrollingEl.css('position', 'relative');
                
                var lastOffset = null;
                var handler = function(e) {                                                 

                    var $snappingElems = $scrollingEl.find(settings.snaps);
                        
                    if (settings.snapOnScrollDirection === true) {                    
                    
                        var matchingEl = null;
                        var prevMatchEl = $snappingElems[0];
                        var curMatchEl = null;
                        
                        // Find the matchingEl of lastOffset
                        $snappingElems.each(function(index) {
                            var maxIndex = $snappingElems.length - 1;
                            var last = $snappingElems[maxIndex];                        
                            var next = index + 1 < $snappingElems.length ? $snappingElems[index + 1] : last;
                            if (lastOffset == this[offsetLT] + settings.offset) {
                                prevMatchEl = $snappingElems[index];
                            }
                            if (this != next && this[offsetLT] + settings.offset <= scrollingEl[scrollLT] &&
                                scrollingEl[scrollLT] < next[offsetLT]) 
                            {
                                curMatchEl = $snappingElems[index];
                            }
                            
                            if (index == maxIndex) {
                                if (!curMatchEl) {
                                    curMatchEl = this;
                                }
                            
                                if (scrollingEl[scrollLT] < lastOffset) {                        
                                    matchingEl = curMatchEl;
                                }
                                else if (scrollingEl[scrollLT] > lastOffset) {
                                    var nextEl = $(curMatchEl).next()[0];
                                    if (nextEl) {
                                        var snapLength = (nextEl[offsetLT] - curMatchEl[offsetLT]);
                                        if (curMatchEl == prevMatchEl ||
                                            (curMatchEl != last && 
                                                snapLength * 0.5 <= scrollingEl[scrollLT] - curMatchEl[offsetLT])) 
                                        {
                                            matchingEl = $(curMatchEl).next()[0];
                                        } else {
                                            matchingEl = curMatchEl;
                                        }
                                    }
                                    if (!matchingEl) {
                                        matchingEl = last;
                                    }
                                }
                                else {
                                    matchingEl = curMatchEl;
                                }                                
                            }
                        });
                    }
                    else {
                        var matchingEl = null, matchingDy = settings.proximity + 1;                
                        $snappingElems.each(function(index) {
                            var snappingEl = this,
                                dy = Math.abs(snappingEl[offsetLT] + settings.offset - scrollingEl[scrollLT]);

                            if (dy < matchingDy) {
                                matchingEl = snappingEl;
                                matchingDy = dy;
                            }
                        });
                    }

                    if (matchingEl) {
                        var endScroll = matchingEl[offsetLT] + settings.offset,
                            animateProp = {},
                            $matchingEl = $(matchingEl);
                        animateProp[scrollLT] = endScroll;
                        if (Math.abs($scrollingEl[scrollLT]() - endScroll)>2) {
                            $scrollingEl.animate(animateProp, settings.duration, settings.easing, debounce(function () {
                                if (settings.onSnap) {
                                    settings.onSnap($matchingEl);
                                }

                                $matchingEl.trigger(settings.onSnapEvent);

                            }, settings.onSnapWait));
                        } else if (endScroll !== lastOffset) {
                            if (settings.onSnap) {
                                settings.onSnap($matchingEl, true);
                            }
                        }
                        lastOffset = endScroll;
                    }

                };

                $scrollingEl.bind('scrollstop', {latency: settings.latency}, handler);

            } else if (scrollingEl.nodeType == 9) {
                // scrollingEl is DOM document

                var win = (scrollingEl.defaultView || scrollingEl.parentWindow);

                var lastOffset = null;
                var handler = function(e) {

                    var matchingEl = null, matchingDy = settings.proximity + 1;

                    $(scrollingEl).find(settings.snaps).each(function() {
                        var tempOffset = (typeof win['scrollX'] != "undefined") ? 'scroll'+settings.direction.toUpperCase() : 'page' + settings.direction.toUpperCase() + 'Offset';
                        var snappingEl = this,
                            dy = Math.abs(($(snappingEl).offset()[leftOrTop.toLowerCase()] + settings.offset) - win[tempOffset]);

                        if (dy < matchingDy) {
                            matchingEl = snappingEl;
                            matchingDy = dy;
                        }
                    });

                    if (matchingEl) {
                        var $matchingEl = $(matchingEl),
                            endScroll = $matchingEl.offset()[leftOrTop.toLowerCase()] + settings.offset,
                            animateProp = {};
                        animateProp[scrollLT] = endScroll;
                        if (Math.abs($scrollingEl[scrollLT]() - endScroll)>2) {
                            $('html, body').animate(animateProp, settings.duration, settings.easing, debounce(function () {
                                if (settings.onSnap) {
                                    settings.onSnap($matchingEl);
                                }

                                $matchingEl.trigger(settings.onSnapEvent)
                            }, settings.onSnapWait));
                        } else if (endScroll !== lastOffset) {
                            if (settings.onSnap) {
                                settings.onSnap($matchingEl, true);
                            }
                        }
                        lastOffset = endScroll;
                    }
                };

                $scrollingEl.bind('scrollstop', {latency: settings.latency}, handler);
                $(win).bind('resize', handler);
            }
        });
    };

})( jQuery );
