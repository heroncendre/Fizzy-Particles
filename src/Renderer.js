import * as THREE from 'three'

import { App } from "./App"
import { EventEmitter } from "./Utils/EventEmitter.js"


export class Renderer extends EventEmitter {
    constructor() {
        super()

        this.app = null
        this.instance = null

        this.resizeHandlerBound = this.resizeHandler.bind(this)

        this.init()
    }
    
    init() {
        this.app = new App()
        
        this.instance = new  THREE.WebGLRenderer({
            canvas : this.app.canvas,
            antialias : true
        })

        this.instance.physicallyCorrectLights = true
        this.instance.outputEncoding = THREE.sRGBEncoding
        this.instance.toneMapping = THREE.CineonToneMapping
        this.instance.toneMappingExposure = 1.75
        this.instance.shadowMap.enabled = false
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap

        this.instance.setSize(this.app.renderSize.width, this.app.renderSize.height)
        this.instance.setPixelRatio(this.app.renderSize.pixelRatio)
        this.instance.setClearColor(new THREE.Color('#202020'))
        
        this.app.renderSize.on('resize', this.resizeHandlerBound)
    }
    
    resizeHandler(info) {
        this.instance.setSize(info.width, info.height)
        this.instance.setPixelRatio(info.pixelRatio)
    }
    
    render(scene, camera) {
        this.instance.render(scene, camera)
    }
    
    destroy() {
        this.app.renderSize.off('resize')
        this.resizeHandlerBound = null

        this.instance.dispose()
        this.instance = null
    }
}