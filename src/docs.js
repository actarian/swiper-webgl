/* global window, document, console, GlslCanvas, Swiper */

(function () {
    'use strict';

    /*--------------------------------------------------
    Swiper
    --------------------------------------------------*/
    function addSwiper() {
        var containerNode = document.querySelector('.section');
        var swiperContainerNode = containerNode.querySelector('.swiper-container');
        var pictureNodes = swiperContainerNode.querySelectorAll('img');
        var glsl;
        // console.log(pictureNodes);
        var pictureData = [];
        var pictures = Array.prototype.slice.call(pictureNodes, 0).map(function (node, index) {
            var src = node.getAttribute('src');
            var img = new Image();
            img.onload = function () {
                console.log('loaded', src);
                pictureData[index] = img;
                if (glsl) {
                    updateTextures(glsl.index, glsl.index);
                }
            };
            img.src = src;
            return src;
        });
        var swiper = new Swiper(swiperContainerNode, {
            direction: 'horizontal',
            pagination: false, // { el: '.swiper-pagination', }
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            speed: 750,
            loop: false,
            preloadImages: true,
            initialSlide: 0,
            on: {
                init: function () {
                    swiper = this;
                    glsl = getGlslCanvas(swiper);
                    glsl.loadTexture('u_tex0', 'https://raw.githubusercontent.com/actarian/swiper-webgl/master/docs/img/masks/mask-01.jpg', {
                        filtering: 'mipmap',
                        repeat: true,
                    });
                },
                slideNextTransitionEnd: function () {
                    swiper = this;
                    onTransitionEnd(swiper, true);
                },
                slidePrevTransitionEnd: function () {
                    swiper = this;
                    onTransitionEnd(swiper, false);
                },
                progress: function () {
                    swiper = this;
                    console.log('progress', swiper.progress);
                }
            }
        });

        var previousX = 0,
            previousIndex = null,
            previousDir = null,
            previousPow = null;

        // per rimuovere il flickr serve un preload

        function getGlslCanvas(swiper) {
            var canvasNode = document.querySelector('.canvas');
            resize(true);
            var glsl = new GlslCanvas(canvasNode, {
                premultipliedAlpha: false,
                preserveDrawingBuffer: true,
                backgroundColor: 'rgba(1,1,1,1)',
            });
            glsl.index = getCurrentIndex(swiper);
            glsl.on('render', function () {
                var x = getX(swiper);
                /*
                if (previousIndex !== index) {
                    previousIndex = index;
                    console.log('newIndex', index);
                    updateTextures(index, index);
                }
                */
                if (previousX !== x) {
                    var dir = x >= 1; // (x - previousX) > 0;
                    if (previousDir !== dir) {
                        previousDir = dir;
                        // console.log('move forward', dir, 'index', index);
                        var from, to;
                        if (dir) {
                            from = glsl.index;
                            to = (glsl.index + 1) % pictures.length;
                            updateTextures(from, to);
                        } else {
                            from = glsl.index;
                            to = (glsl.index - 1) % pictures.length;
                            to = to < 0 ? to + pictures.length : to;
                            updateTextures(to, from);
                        }
                    }
                    previousX = x;
                    var pow = x % 1.0;
                    if (previousPow !== pow) {
                        previousPow = pow;
                        glsl.setUniforms({
                            u_mix: pow
                        });
                    }
                }
                glsl.forceRender = true;
            });
            getResource("shaders/tween.glsl", function (data) {
                glsl.load(data);
            });

            function resize(init) {
                var w = containerNode.offsetWidth;
                var h = containerNode.offsetHeight;
                canvasNode.style.width = w + 'px';
                canvasNode.style.height = h + 'px';
                canvasNode.width = w;
                canvasNode.height = h;
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
            return glsl;
        }

        function getCurrentIndex(swiper) {
            return swiper.realIndex !== undefined ? swiper.realIndex : swiper.activeIndex;
        }

        function onTransitionEnd(swiper, forward) {
            if (glsl) {
                glsl.index = getCurrentIndex(swiper);
                // console.log('onTransitionEnd', glsl.index);
                updateTextures(glsl.index, glsl.index);
            }
        }

        function updateTextures(index1, index2) {
            index1 = index1 || 0;
            // console.log('updateTextures', index1, index2);
            if (glsl) {
                var picture1 = pictureData[index1 % pictures.length];
                var picture2 = pictureData[index2 % pictures.length];
                glsl.loadTexture('u_tex1', picture1, {
                    filtering: 'mipmap',
                    repeat: true,
                });
                glsl.loadTexture('u_tex2', picture2, {
                    filtering: 'mipmap',
                    repeat: true,
                });
                // console.log('glsl.updateTextures', 'from', from, 'to', to);
            }
        }

        /*
        function getNextIndex(swiper, forward) {
            var index = getCurrentIndex(swiper);
            index = forward ? index + 1 : index - 1;
            index = index % pictures.length;
            if (index < 0) {
                index = pictures.length + index;
            }
            console.log('getNextIndex', index);
            return index;
        }
        
        function getPreviousIndex(swiper) {
            var index = swiper.realIndex - (swiper.activeIndex - swiper.previousIndex);
            return index;
        }
        */

        function getX(swiper) {
            return (swiper.getTranslate() / swiperContainerNode.offsetWidth * -1);
        }

        function getPow(swiper) {
            return getX(swiper) % 1.0;
        }

    }

    addSwiper();

    function getResource(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.addEventListener('load', function () {
            callback(request.responseText);
        });
        request.send();
    }

}());