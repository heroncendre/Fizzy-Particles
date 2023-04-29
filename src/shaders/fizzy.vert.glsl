precision highp float;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform vec3 uColor;
uniform float uSinTime;
uniform float uTime;
uniform float uDepth;
uniform float uSize;
uniform float uDisplaceSpeed;
uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform float uDispersion;
uniform sampler2D uTouchTexture;

attribute vec3 position;
attribute vec2 uv;

attribute vec3 aPPosition;
attribute float aPIndex;
attribute float aPScale;
attribute float aPTouchAngle;

varying vec2 vUv;
varying vec2 vPUv;
varying vec3 vColor;

#include common/random
#include common/color

void main() {
	vUv = uv;

	vec2 puv = aPPosition.xy / uTextureSize;
	vPUv = puv;

	// float lum = scurve(luma(texture2D(uTexture, puv).rgb));
	float lum = luma(texture2D(uTexture, puv).rgb);

	// particle positionning in the whole mesh
	vec3 pPosition = aPPosition;

	// randomise particle position on the xy axis, add constant to obtain different shifts
	pPosition.xy += (vec2(random(aPIndex), random(aPIndex + 6143.461) - vec2(0.5)));

	// randomise particles position on the z axis with animation
	float rndz = snoise(vec2(pPosition.x, pPosition.y + uTime * uDisplaceSpeed));

	pPosition.z += rndz * (random(aPIndex) * 2.0 * uDepth);

	// shift to texture center
	pPosition.xy -= uTextureSize * 0.5;


	// touch
	float t = texture2D(uTouchTexture, puv).r;
	float touch = 20. * uDispersion;
	pPosition.z += t * touch * rndz;
	pPosition.x += cos(aPTouchAngle) * t * touch * rndz;
	pPosition.y += sin(aPTouchAngle) * t * touch * rndz;


	// particle size
	float n = snoise(vec2(uTime / 5., aPIndex));
	float psize = n * max(lum, 0.15) * uSize;

	vec3 displacedPosition = position * psize + pPosition;

	// finally project
	vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);
	vec4 viewPos = viewMatrix * worldPos;
	gl_Position = projectionMatrix * viewPos;
}
