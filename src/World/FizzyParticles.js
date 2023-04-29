import * as THREE from 'three'
import { App } from '../App.js'

import fizzyVS from '/shaders/fizzy.vert.glsl'
import fizzyFS from '/shaders/fizzy.frag.glsl'

export class FizzyParticles {
    constructor(touchTexture) {
        this.app = new App()

        this.touchTexture = touchTexture

        this.container = null
        this.mesh = null
        this.geometry = null
        this.material = null
        this.texture = null

        this.nParticles = 0
        this.pVisible = null
        this.nVisibles = 0

        this.ui = null
    }
    
    static LUMA_THRESHOLD = 48
    
    load(texture) {
        this.texture = texture
        
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        
        this.width = this.texture.image.width
        this.height = this.texture.image.height
        
        this.nParticles = this.width * this.height
        
        this.pVisible = new Array(this.nParticles).fill(true)
        this.nVisibles = 0
    
        this.initVisibility()
        this.initObjects()
    }

    initVisibility() {
        // Get imaga data from the texture image
        // Only create a particle for points over the luminance threshold
        const imgCanvas = document.createElement('canvas')
        imgCanvas.width = this.width
        imgCanvas.height = this.height

        const ctx = imgCanvas.getContext('2d')
        ctx.scale(1, -1)
        ctx.drawImage(this.texture.image, 0, 0, this.width, this.height * -1)

        const imgData = ctx.getImageData(0, 0, this.width, this.height)
        const imgPixels = Float32Array.from(imgData.data)

        // Count pixels with a sufficient luminance
        for (let i = 0; i < this.nParticles; i++) {
            const i4 = i * 4
            const luma = imgPixels[i4 + 0] * 0.21 + imgPixels[i4 + 1] * 0.71 + imgPixels[i4 + 2] * 0.07
            this.pVisible[i] = luma > FizzyParticles.LUMA_THRESHOLD
            if (luma > FizzyParticles.LUMA_THRESHOLD) {
                this.nVisibles++
            }
        }
    }

    /*
     * Create the instanced buffer geometry
     * with some constant attributes for every tile : BufferAttribute
     * and some attributes specific to each tile : InstancedBufferAttribute
     */
    initGeometry() {
        this.geometry = new THREE.InstancedBufferGeometry()
    
        // Constant attributes
        const positionAttr = new THREE.BufferAttribute(new Float32Array(4 * 3), 3)
        positionAttr.setXYZ(0, -0.5,  0.5, 0)
        positionAttr.setXYZ(1,  0.5,  0.5, 0)
        positionAttr.setXYZ(2,  0.5, -0.5, 0)
        positionAttr.setXYZ(3, -0.5, -0.5, 0)
        this.geometry.setAttribute('position', positionAttr)
        
        const uvAttr = new THREE.BufferAttribute(new Float32Array(4 * 2), 2, false)
        uvAttr.setXYZ(0, 0, 1)
        uvAttr.setXYZ(1, 1, 1)
        uvAttr.setXYZ(2, 1, 0)
        uvAttr.setXYZ(3, 0, 0)
        this.geometry.setAttribute('uv', uvAttr)
        
        const indexAttr = new THREE.BufferAttribute(new Uint16Array([ 0, 2, 1, 0, 3, 2 ]), 1)
        this.geometry.setIndex(indexAttr)
        
        // Tile speficic attributes
        const pPositions = new Float32Array(this.nVisibles * 3)
        const pIndices = new Uint16Array(this.nVisibles)
        const pRandomScales = new Float32Array(this.nVisibles)
        const pTouchAngles = new Float32Array(this.nVisibles)
        
        for (let i = 0, p = 0; i < this.nParticles; i++) {
            // Discard every point darker than the threshold
            if (this.pVisible[i] === false) { 
                continue
            }
    
            pPositions[p * 3 + 0] = i % this.width // [0 .. 1279]
            pPositions[p * 3 + 1] = Math.floor(i / this.width) // [0 .. 1919]
            pPositions[p * 3 + 2] = 0
        
            pIndices[p] = i
            pRandomScales[p] = Math.random() * 15    	
            pTouchAngles[p] = Math.random() * Math.PI
    
            p++
        }
        
        this.geometry.setAttribute('aPPosition', new THREE.InstancedBufferAttribute(pPositions, 3, false))
        this.geometry.setAttribute('aPScale', new THREE.InstancedBufferAttribute(pRandomScales, 1, false))
        this.geometry.setAttribute('aPIndex', new THREE.InstancedBufferAttribute(pIndices, 1, false))
        this.geometry.setAttribute('aPTouchAngle', new THREE.InstancedBufferAttribute(pTouchAngles, 1, false))   
    }

    initMaterial() {
        this.material = new THREE.RawShaderMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            vertexShader: fizzyVS,
            fragmentShader: fizzyFS,
            uniforms: {
                uBlackAndWhite: { value: false },
                uContrast: { value: 0.2 },
                uLCrop: { value: 0.1 },
                uHCrop: { value: 0.8 },
                uExposure: { value: 1.0 },
                uTime: { value: 0 },
                uSize: { value: 8.5 },
                uDepth: { value: 4.0 },
                uDisplaceSpeed: { value: 0.15 },
                uTexture: { value: this.texture },
                uTextureSize: { value: new THREE.Vector2(this.width, this.height) },
                uDispersion: { value: 1.0 },
                uTouchTexture: { value: this.touchTexture.texture }
            }
        })

        if (this.app.debug.active) {
            this.ui = []
            
            const gFImage = this.app.debug.ui.addFolder('Image Controls')
            gFImage.add(this.material.uniforms.uBlackAndWhite, 'value').name("Black and white")
            gFImage.add(this.material.uniforms.uExposure, 'value').min(0.01).max(2).step(0.001).name("Exposure")
            gFImage.add(this.material.uniforms.uContrast, 'value').min(0).max(1).step(0.001).name("Constrast")
            gFImage.add(this.material.uniforms.uLCrop, 'value').min(0).max(1).step(0.001).name("Black crop")
            gFImage.add(this.material.uniforms.uHCrop, 'value').min(0).max(1).step(0.001).name("White crop")
    
            const gFParticles = this.app.debug.ui.addFolder('Particles')
            gFParticles.add(this.material.uniforms.uSize, 'value').min(0).max(15).step(0.1).name("Particle size")
            gFParticles.add(this.material.uniforms.uDisplaceSpeed, 'value').min(0).max(1).step(0.001).name("Displace speed")
            gFParticles.add(this.material.uniforms.uDepth, 'value').min(0).max(10).step(0.001).name("Displace depth")
            
            const gFInteraction = this.app.debug.ui.addFolder('Interaction')
            gFInteraction.add(this.material.uniforms.uDispersion, 'value').min(0).max(10).step(0.01).name("Dispersion")
            gFInteraction.add(this.app.touchTexture, 'ttl').min(0).max(4).step(0.01).name("Duration")
            gFInteraction.add(this.app.touchTexture, 'radius').min(0).max(10).step(0.01).name("Spread")

            this.ui.push(gFImage, gFParticles, gFInteraction)
        }
    }

    initObjects() {
        this.container = new THREE.Object3D()

        this.initGeometry()
        this.initMaterial()

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.x = 0
        this.container.add(this.mesh)
        
        // Scale the mesh to make it fill the canvas vertically
        // Todo : best fit based on image aspect
        const scale = this.app.fovHeight / this.height
        this.container.scale.set(scale, scale, 1)
    }

    update(elapsed) {
        if (this.material !== null) {
            this.material.uniforms.uTime.value = elapsed
        }    
    }

    clearScene() {
        if (this.geometry !== null) {
            this.geometry.dispose()
            this.geometry = null
        }

        if (this.material !== null) {
            this.material.dispose()
            this.material = null
        }
        
        if (this.container !== null) {
            this.container.remove(this.mesh)
            this.container = null
        }

        this.mesh = null
    }

    destroy() {
        this.clearScene()

        if (this.ui !== null) {
            for (const folder of this.ui) {
                folder.destroy()
            }

            this.ui.length = 0
            this.ui = null
        }

        this.pVisible.length = 0
        this.pVisible = null

        this.touchTexture = null
        this.app = null
    }
}
