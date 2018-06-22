/* global window, document, console, GlslCanvas, Swiper, TweenLite */

(function () {
    'use strict';

    window.Utils = {
        getResource: getResource,
    };

    function getResource(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.addEventListener('load', function () {
            callback(request.responseText);
        });
        request.send();
    }

}());