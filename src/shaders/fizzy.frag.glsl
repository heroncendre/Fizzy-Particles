precision mediump float;

varying vec2 vUv;
varying vec2 vPUv;

uniform sampler2D uTexture;
uniform int uBlackAndWhite;
uniform float uContrast;
uniform float uLCrop;
uniform float uHCrop;
uniform float uExposure;

#include common/color

void main() {
    float radius = distance(vUv, vec2(0.5));
	float t = smoothstep(0.0, 0.3, 0.5 - radius);
    vec3 color = vec3(texture2D(uTexture, vPUv).rgb);
    
    if (uBlackAndWhite == 1) color = vec3(luma(color));

    // float hcrop = max(uLCrop, uHCrop);
    color = toneCurve(color, uContrast, uLCrop, uHCrop, uExposure);

    gl_FragColor = vec4(color, t);
}
