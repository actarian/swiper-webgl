precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_mix;
uniform float u_time;
uniform float u_hover;

uniform sampler2D u_tex0;
uniform sampler2D u_tex1;

uniform vec2 u_tex0Resolution;
uniform vec2 u_tex1Resolution;

#define uv gl_FragCoord.xy / u_resolution.xy
#define rx 1.0 / min(u_resolution.x, u_resolution.y)
#define mx u_mouse.xy / u_resolution.xy

// #define st coord(gl_FragCoord.xy)
// #define mx coord(u_mouse)

vec2 cropCenter(vec2 p, vec2 res) {
    vec2 ratio = u_resolution / res;
    p *= ratio;
    p /= max(ratio.x, ratio.y);
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
    
    float displacement1 = mixer * displacementStrength;
    vec2 coord1 = xy + vec2(noise.r * displacement1, noise.g * displacement1) + bubbling;      
    vec3 texture1 = texture2D(u_tex1, cropCenter(coord1, u_tex1Resolution)).rgb;  

    vec3 color = texture1;
    color = mix(color, vec3((color.r + color.g + color.b) / 3.0), 1.0 - u_hover);
    
    gl_FragColor = vec4(color, 1.0);
}
