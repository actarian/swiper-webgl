precision mediump float;

uniform sampler2D u_tex0; /* https://raw.githubusercontent.com/actarian/swiper-webgl/master/docs/img/masks/mask-01.jpg */
uniform sampler2D u_tex1; /* https://raw.githubusercontent.com/actarian/swiper-webgl/master/docs/img/pic-01.jpg */
uniform sampler2D u_tex2; /* https://raw.githubusercontent.com/actarian/swiper-webgl/master/docs/img/pic-02.jpg */

uniform vec2 u_tex0Resolution;
uniform vec2 u_tex1Resolution;
uniform vec2 u_tex2Resolution;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_mix;
uniform float u_time;

#define uv gl_FragCoord.xy / u_resolution.xy
#define rx 1.0 / min(u_resolution.x, u_resolution.y)
#define st coord(gl_FragCoord.xy)
#define mx coord(u_mouse)

vec2 cropCenter(vec2 p, vec2 res) {
    vec2 ratio = u_resolution / res;
    p *= ratio;
    p /= max(ratio.x, ratio.y);
    // p += (max(ratio.x, ratio.y) - min(ratio.x, ratio.y));
    return p;
}

void main() {
    float mixer = u_mix;
    float displacementStrength = 0.5;
    float transition = (abs(mixer - 0.5) * 2.0);

    // bubbling effect
    vec2 bubbling = cos(u_time + uv) * 0.01 * (1.0 - transition);
    
    // noise texture
    vec3 noise = texture2D(u_tex0, cropCenter(uv, u_tex0Resolution)).rgb;    
    
    // picture A texture
    float displacement1 = mixer * displacementStrength;
    vec2 coord1 = uv + vec2(noise.r * displacement1, noise.g * displacement1) + bubbling;    
    vec3 texture1 = texture2D(u_tex1, cropCenter(coord1, u_tex1Resolution)).rgb;  

    // picture B texture
    float displacement2 = (1.0 - mixer) * displacementStrength;
    vec2 coord2 = uv - vec2(noise.r * displacement2, noise.g * displacement2) + bubbling;      
    vec3 texture2 = texture2D(u_tex2, cropCenter(coord2, u_tex2Resolution)).rgb;     

    // transition noised
    float transitionNoised = mix(noise.r, mixer, transition);

    vec3 color = mix(texture1, texture2, transitionNoised);
    
    gl_FragColor = vec4(color, 1.0);
}