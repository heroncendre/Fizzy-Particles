/**
 * Fizzy particles experience
 * Author: Yann Gilquin
 * 
 * Inspired by https://tympanus.net/Tutorials/InteractiveParticles/
 */

import * as THREE from 'three'

import { TouchTexture } from './TouchTexture.js'
import { FizzyParticles } from './World/FizzyParticles.js'
import { AnimationLoop } from './Utils/AnimationLoop.js'
import { RenderSize } from './Utils/RenderSize.js'
import { Camera } from './Camera.js'
import { Renderer } from './Renderer.js'
import { AssetManager } from './Utils/AssetManager.js'
import { Debug } from './Utils/Debug.js'
import { EventEmitter } from './Utils/EventEmitter.js'

import assets from "./assets.js"

// Singleton app
let instance = null

export class App extends EventEmitter {
    constructor(canvas) {
        if (instance !== null) {
            return instance
        }

        super()
        instance = this
        
        this.canvas = canvas
        
        this.animationLoop = null
        this.renderSize = null
        this.camera = null
        this.controls = null
        this.touchTexture = null
        this.fizzy = null
        this.scene = null
        this.renderer = null
        this.assetManager = null
        this.images = null
        this.imageIndex = 0

        this.fovHeight = 0 // World units
        this.fovWidth = 0 // World units

        this.assetManagerReadyHandlerBound = this.assetManagerReadyHandler.bind(this)
        this.resizeHandlerBound = this.resizeHandler.bind(this)
        this.updateBound = this.update.bind(this)

        this.init()
    }    

    static ANIMATION_PERIOD = 10
    static ANIMATION_XY = 0.03
    static ANIMATION_Z = 0.075

    init() {
        this.debug = new Debug()
        if (this.debug.active) {
            window.app = instance
        }

        this.animationLoop = new AnimationLoop()
        this.animationLoop.on('tick', this.updateBound)
        
        this.renderSize = new RenderSize()
        this.renderSize.on('resize', this.resizeHandlerBound)
        
        this.initWebGL()
        
        this.touchTexture = new TouchTexture()
        
        this.assetManager = new AssetManager(assets)
        this.assetManager.on('ready', this.assetManagerReadyHandlerBound)
        this.assetManager.startLoading()
    }
    
    resizeHandler(info) {
        this.fovWidth = this.fovHeight * info.aspect
    }

    assetManagerReadyHandler(info) {
        this.images = this.assetManager.getItemNamesOfType('texture')
        const image = this.assetManager.getItem(this.images[0])

        this.animationLoop.start()

        this.loadImage(image)
    }

    loadImage(image) {
        // this.animationLoop.stop()

        if (this.fizzy !== null) {
            this.scene.remove(this.fizzy.container)
            this.fizzy.destroy()
        }

        this.fizzy = new FizzyParticles(this.touchTexture)
        this.fizzy.load(image)
        this.scene.add(this.fizzy.container)
    
        this.touchTexture.Radius = 8
        this.fizzy.Fizzyness = 6
        this.touchTexture.startRamp(2)
        
        window.setTimeout(() => {
            this.touchTexture.Radius = 5
            this.fizzy.Fizzyness = 2
        }, 2000)        
    }    

    nextImage() {
        this.imageIndex = (this.imageIndex + 1) % this.images.length
        const image = this.assetManager.getItem(this.images[this.imageIndex])
        this.loadImage(image)
    }
    
    previousImage() {
        this.imageIndex = this.imageIndex === 0 ? this.images.length - 1 : this.imageIndex - 1
        const image = this.assetManager.getItem(this.images[this.imageIndex])
        this.loadImage(image)
    }

    initWebGL() {
        this.renderer = new Renderer()
        
        this.scene = new THREE.Scene()

        this.camera = new Camera()
        this.camera.instance.position.z = 100

        this.fovHeight = 2 * this.camera.instance.position.z * Math.tan((this.camera.instance.fov * Math.PI) / 180 / 2)
        this.fovWidth = this.fovHeight * this.renderSize.aspect
    }
    
    update(info) {
        this.trigger('beforeRender')
        
        // Update camera position and keep lookAt center of the scene
        this.camera.instance.position.x = this.camera.instance.position.z * App.ANIMATION_XY * Math.cos(info.elapsed)
        this.camera.instance.position.y = this.camera.instance.position.z * App.ANIMATION_XY * Math.sin(info.elapsed)
        this.camera.instance.position.z -= (Math.sin(Math.PI * 2 * info.elapsed / App.ANIMATION_PERIOD)) * App.ANIMATION_Z
        this.camera.instance.lookAt(new THREE.Vector3())
        
        // Update uniforms
        this.fizzy.update(info.elapsed)
        
        // Update touch texture
        this.touchTexture.update(info.delta)
        
        // Render the scene
        this.renderer.render(this.scene, this.camera.instance)
        
        // Update debug
        this.debug.update()

        this.trigger('afterUpdate')
    }

    destroy() {
        this.animationLoop.off('tick')
        this.renderSize.off('resize')
        this.assetManager.off('ready')

        this.assetManagerReadyHandlerBound = null
        this.resizeHandlerBound = null
        this.updateBound = null

        this.animationLoop.destroy()
        this.animationLoop = null
        
        this.camera.destroy()
        this.camera = null

        this.renderer.destroy()
        this.renderer = null

        this.fizzy.destroy()
        this.fizzy = null

        this.touchTexture.destroy()
        this.touchTexture = null

        this.renderSize.destroy()
        this.renderSize = null

        this.assetManager.destroy()
        this.assetManager = null
        
        this.images.length = 0
        this.images = null

        this.debug.destroy()
        this.debug = null

        this.scene = null                
        this.canvas = null
    }
}