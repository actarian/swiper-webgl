/* global window, document, console, GlslCanvas, TweenLite */

(function () {
    'use strict';

    [].slice.call(document.querySelectorAll('[webgl-hover]')).map(function (containerNode) {
        containerNode.webglHover = new WebglHover(containerNode);
    });

    function WebglHover(containerNode) {
        var uniforms = {
            hover: 0.0,
        };
        var canvasNode = document.createElement('canvas');
        canvasNode.setAttribute('class', 'canvas');
        containerNode.insertBefore(canvasNode, containerNode.firstChild);

        resize(true);
        var glsl = new GlslCanvas(canvasNode, {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
            backgroundColor: 'rgba(1,1,1,1)',
        });
        var pictureNode = containerNode.querySelector('img');
        var src = pictureNode.getAttribute('src');
        console.log(src);
        var img = new Image();
        img.onload = function () {
            glsl.uniformTexture('u_tex1', img, {
                filtering: 'mipmap',
                repeat: true,
            });
        };
        img.src = src;

        var shader = containerNode.getAttribute('webgl-hover');
        Utils.getResource(shader, function (data) {
            glsl.load(data);
        });

        glsl.loadTexture('u_tex0', 'img/textures/tile-02.jpg', {
            filtering: 'mipmap',
            repeat: true,
        });
        /*
        glsl.on('render', function () {
            glsl.forceRender = true;
        });
        */
        var ri;
        onResize();
        window.addEventListener('resize', onResize, true);
        containerNode.addEventListener('mouseover', onOver);
        containerNode.addEventListener('mouseout', onOut);

        function onResize() {
            if (ri) {
                clearTimeout(ri);
            }
            ri = setTimeout(resize, 50);
        }

        function resize(init) {
            var w = containerNode.offsetWidth;
            var h = containerNode.offsetHeight;
            canvasNode.style.width = w + 'px';
            canvasNode.style.height = h + 'px';
            canvasNode.width = w;
            canvasNode.height = h;
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

    }

}());