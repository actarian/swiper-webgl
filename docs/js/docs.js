/* global window, document, console, GlslCanvas, Swiper, TweenLite */

(function () {
    'use strict';

    Element.prototype.hasClass = function (name) {
        return new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)").test(this.className);
    };

    Element.prototype.addClass = function (name) {
        if (!this.hasClass(name)) {
            this.className = this.className ? (this.className + ' ' + name) : name;
        }
    };

    Element.prototype.removeClass = function (name) {
        if (this.hasClass(name)) {
            this.className = this.className.split(name).join('').replace(/\s\s+/g, ' '); // .replace(new RegExp('(?:^|\\s+)' + name + '(?:\\s+|$)', 'g'), '');
        }
    };

    addSwiper();

    function addSwiper() {
        var containerNode = document.querySelector('.section');
        var infoNode = containerNode.querySelector('.info > span');
        var swiperContainerNode = containerNode.querySelector('.swiper-container');
        var pictureNodes = swiperContainerNode.querySelectorAll('img');
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
            mousewheel: true,
            on: {
                init: function () {
                    swiper = this;
                    swiperContainerNode.addClass('active');
                    glsl = getGlslCanvas(swiper);
                    glsl.loadTexture('u_tex0', 'https://raw.githubusercontent.com/actarian/swiper-webgl/master/docs/img/masks/mask-01.jpg', {
                        filtering: 'mipmap',
                        repeat: true,
                    });
                    containerNode.addEventListener('mouseover', onOver);
                    containerNode.addEventListener('mouseout', onOut);
                },
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

        function onOver() {
            TweenLite.to(uniforms, 2.0, {
                hover: 1.0,
                ease: Elastic.easeOut,
                overwrite: 'all',
                onUpdate: function () {
                    glsl.setUniform('u_hover', uniforms.hover);
                },
            });
        }

        function onOut() {
            TweenLite.to(uniforms, 2.0, {
                hover: 0.0,
                ease: Elastic.easeOut,
                overwrite: 'all',
                onUpdate: function () {
                    glsl.setUniform('u_hover', uniforms.hover);
                },
            });
        }

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
            return (swiper.getTranslate() / containerNode.offsetWidth * -1);
        }

        function getPow(swiper) {
            return getX(swiper) % 1.0;
        }

    }

    function getResource(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.addEventListener('load', function () {
            callback(request.responseText);
        });
        request.send();
    }

}());