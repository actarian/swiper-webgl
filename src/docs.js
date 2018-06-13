/* global window, document, console, GlslCanvas, Swiper */

(function () {
    'use strict';

    /*--------------------------------------------------
    Swiper
    --------------------------------------------------*/
    function addSwiper() {

        var sectionNode = document.querySelector('.section');

        var swiperNode = document.querySelector('.swiper-container');
        var swiper = new Swiper(swiperNode, {
            direction: 'horizontal',
            pagination: false, // { el: '.swiper-pagination', }
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            speed: 750,
            loop: false,
            // watchSlidesProgress: true,
        });
        /*
        swiper.on('progress', function () {
            for (var i = 0; i < swiper.slides.length; i++) {
                var slide = swiper.slides[i];
                console.log(i, slide.progress);
            }
        });
        */

        var glslNode = document.querySelector('.canvas');

        resize(true);

        var glsl = new GlslCanvas(glslNode, {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
            backgroundColor: 'rgba(1,1,1,1)',
        });
        glsl.on('render', function () {
            var mix = swiper.getTranslate() / swiperNode.offsetWidth * -1;
            glsl.setUniforms({
                u_mix: mix
            });
            // glsl.forceRender = true;
        });
        glsl.on('load', function () {

        });
        getResource("shaders/tween.glsl", function (data) {
            glsl.load(data);
        });

        function resize(init) {
            var W = sectionNode.offsetWidth;
            var H = sectionNode.offsetHeight;
            glslNode.style.width = W + 'px';
            glslNode.style.height = H + 'px';
            if (init) {
                glslNode.width = W;
                glslNode.height = H;
            } else {
                glsl.resize();
            }
            console.log(W, H, glslNode.offsetWidth, glslNode.offsetHeight);

            /*
            var w = content.offsetWidth + o;
            var h = content.offsetHeight + o;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            canvas.width = w;
            canvas.height = h;
            */
        }


        var ri;

        function onResize() {
            if (ri) {
                clearTimeout(ri);
            }
            ri = setTimeout(resize, 50);
        }

        window.onresize = function (event) {
            onResize();
        };

        onResize();
        /*
        for (var t in o.textures) {
            glsl.uniformTexture('u_texture_' + t, o.textures[t], {
                filtering: 'mipmap',
                repeat: true,
            });
        }
        gui.load(o.uniforms);
        glsl.setUniforms(gui.uniforms());
        */

    }


    addSwiper();

    /*
    function init() {
        var frag_header = '';
        getResource("shaders/tween.glsl", function (data) {

        });
    }

    */

    function getResource(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.addEventListener('load', function () {
            callback(request.responseText);
        });
        request.send();
    }

}());