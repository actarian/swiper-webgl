/* global window, document, console, GlslCanvas, Swiper, TweenLite */

(function () {
    'use strict';

    [].slice.call(document.querySelectorAll('[webgl-swiper]')).map(function (containerNode) {
        containerNode.webglSwiper = new WebglSwiper(containerNode);
    });

    function WebglSwiper(containerNode) {
        var infoNode = containerNode.querySelector('.info > span');
        var swiperContainerNode = containerNode.querySelector('.swiper-container');
        var pictureNodes = swiperContainerNode.querySelectorAll('img');
        var previousX = 0,
            previousIndex = null,
            previousDir = null,
            previousPow = null;
        // per rimuovere il flickr serve un preload
        var glsl;
        var uniforms = {
            hover: 0.0,
        };
        var pictureData = [];
        var pictures = Array.prototype.slice.call(pictureNodes, 0).map(function (node, index) {
            var src = node.getAttribute('src');
            var img = new Image();
            img.onload = function () {
                // console.log('loaded', src);
                pictureData[index] = img;
                if (glsl) {
                    updateTextures(glsl.index, glsl.index);
                }
            };
            // img.crossOrigin = 'Anonymous';
            img.src = src;
            return src;
        });
        var swiper = new Swiper(swiperContainerNode, {
            direction: 'horizontal',
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            pagination: {
                el: '.swiper-pagination',
                type: 'bullets',
                clickable: true,
            },
            speed: 750,
            loop: true,
            preloadImages: true,
            initialSlide: 0,
            mousewheel: false,
            on: {
                init: onInit,
                slideNextTransitionEnd: function () {
                    swiper = this;
                    onTransitionEnd(swiper, true);
                },
                slidePrevTransitionEnd: function () {
                    swiper = this;
                    onTransitionEnd(swiper, false);
                },
                /*
                progress: function () {
                    swiper = this;
                    // console.log('progress', swiper.progress);
                }
                */
            }
        });
        return swiper;

        function onInit() {
            swiper = this;
            swiperContainerNode.addClass('active');
            var shader = containerNode.getAttribute('webgl-swiper');
            console.log(shader);
            glsl = getGlslCanvas(shader);
            glsl.loadTexture('u_tex0', 'img/textures/tile-02.jpg', {
                filtering: 'mipmap',
                repeat: true,
            });
            glsl.index = getCurrentIndex(swiper);
            glsl.on('render', function () {
                var x = getPow(swiper);
                // x = Math.min(0.99, x);
                var diff = x - previousX;
                if (previousX !== x && Math.abs(diff) < 0.9) {
                    previousX = x;
                    var dir = diff > 0;
                    // infoNode.innerText = x.toFixed(2) + ' ' + swiper.realIndex + ' ' + dir;
                    if (previousDir !== dir) {
                        previousDir = dir;
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
                    glsl.setUniforms({
                        u_mix: x
                    });
                }
                // glsl.forceRender = true;
            });
            containerNode.addEventListener('mouseover', onOver);
            containerNode.addEventListener('mouseout', onOut);
        }

        function onOver() {
            TweenLite.to(uniforms, 0.55, {
                hover: 1.0,
                ease: Power2.easeOut,
                overwrite: 'all',
                onUpdate: function () {
                    glsl.setUniform('u_hover', uniforms.hover);
                },
            });
        }

        function onOut() {
            TweenLite.to(uniforms, 0.55, {
                hover: 0.0,
                ease: Power2.easeOut,
                overwrite: 'all',
                onUpdate: function () {
                    glsl.setUniform('u_hover', uniforms.hover);
                },
            });
        }

        function getGlslCanvas(shader) {
            var canvasNode = document.createElement('canvas');
            canvasNode.setAttribute('class', 'canvas');
            containerNode.insertBefore(canvasNode, containerNode.firstChild);

            resize(true);

            var glsl = new GlslCanvas(canvasNode, {
                premultipliedAlpha: false,
                preserveDrawingBuffer: true,
                backgroundColor: 'rgba(1,1,1,1)',
            });

            Utils.getResource(shader, function (data) {
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
            onResize();
            window.addEventListener('resize', onResize, true);
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
                glsl.uniformTexture('u_tex1', picture1, {
                    filtering: 'mipmap',
                    repeat: true,
                });
                glsl.uniformTexture('u_tex2', picture2, {
                    filtering: 'mipmap',
                    repeat: true,
                });
                // console.log('glsl.updateTextures', 'from', from, 'to', to);
            }
        }

        function getX(swiper) {
            return (swiper.getTranslate() / containerNode.offsetWidth * -1);
        }

        function getPow(swiper) {
            return getX(swiper) % 1.0;
        }

    }

}());