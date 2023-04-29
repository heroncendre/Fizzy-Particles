float luma(vec3 color) {
	return color.r * 0.21 + color.g * 0.71 + color.b * 0.07;
}

vec3 toneCurve(vec3 color, float contrast, float lCrop, float hCrop, float exposure) {
    contrast *= 0.5;
    vec3 exposed = pow(color, vec3(1.0 / exposure));
    vec3 contrasted = smoothstep(contrast, 1. - contrast, exposed);
    
    float lum = luma(contrasted);
    vec3 cropped = hCrop * step(lCrop, lum) * contrasted;
    return cropped;
}
