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
uniform float u_hover;

#define uv gl_FragCoord.xy / u_resolution.xy
#define rx 1.0 / min(u_resolution.x, u_resolution.y)
#define mx u_mouse.xy / u_resolution.xy
// #define st coord(gl_FragCoord.xy)
// #define mx coord(u_mouse)

vec2 cropCenter(vec2 p, vec2 res) {
    vec2 ratio = u_resolution / res;
    p *= ratio;
    p /= max(ratio.x, ratio.y);
    // p += (max(ratio.x, ratio.y) - min(ratio.x, ratio.y));
    return p;
}

vec2 distort(vec2 xy, float value) {
    return xy + ((xy - mx) * -value * (1.0 - dot(xy, xy))) * 0.2;   
}

vec2 distort2(vec2 xy, float value, float noise) {
    xy *= 1.0 - (0.2 * value);
    return xy + length(xy - mx) * noise * value;   
}

void main() {
    float mixer = u_mix;
    float displacementStrength = 0.5;
    float transition = (abs(mixer - 0.5) * 2.0);

    vec2 xy = uv;

    vec2 nx = vec2(xy.x + u_time * 0.02, xy.y + u_time * 0.03 + cos(xy.x) * 0.1); 
    
    // noise texture
    vec3 noise = texture2D(u_tex0, cropCenter(nx, u_tex0Resolution)).rgb;    
    
    xy = distort2(xy, 1.0 - u_hover, noise.r * 0.3);

    // bubbling effect
    vec2 bubbling = cos(u_time + xy) * 0.01 * (1.0 - transition);
    
    // picture A texture
    float displacement1 = mixer * displacementStrength;
    vec2 coord1 = xy + vec2(noise.r * displacement1, noise.g * displacement1) + bubbling;  
    
    // coord1.x += (u_time + (cos(coord1.y) * 0.5)) * u_hover;
    // coord1.y += (u_time * 0.25) * u_hover;
    
    vec3 texture1 = texture2D(u_tex1, cropCenter(coord1, u_tex1Resolution)).rgb;  

    // picture B texture
    float displacement2 = (1.0 - mixer) * displacementStrength;
    vec2 coord2 = xy - vec2(noise.r * displacement2, noise.g * displacement2) + bubbling;      
    vec3 texture2 = texture2D(u_tex2, cropCenter(coord2, u_tex2Resolution)).rgb;     

    // transition noised
    float transitionNoised = mix(noise.r, mixer, transition);

    vec3 color = mix(texture1, texture2, transitionNoised);
    color = mix(color, vec3((color.r + color.g + color.b) / 3.0), 1.0 - u_hover);
    
    gl_FragColor = vec4(color, 1.0);
}



/*
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv.x *= (1920.0/1080.0);
    vec2 v = (uv - vec2(.5 * 1920.0/1080.0, .5));
    vec4 m = iMouse / iResolution.xxxx;
    
    //float amount = m.x;
    float amount = (sin(iTime * 4.0) * .5 ) ;
        
    uv = uv + distort(v, amount);
	fragColor = texture(iChannel0, uv);
}
*/
