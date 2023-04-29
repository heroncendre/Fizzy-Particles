import * as THREE from 'three'
import { App } from './App'
import { EventEmitter } from './Utils/EventEmitter'

export class Camera extends EventEmitter {
    constructor() {
        super()
        
        this.app = null        
        this.instance = null
        this.controls = null

        this.resizeHandlerBound = this.resizeHandler.bind(this)

        this.init()
    }
    
    init() {
        this.app = new App()
        
        this.instance = new THREE.PerspectiveCamera(90, this.app.renderSize.aspect, 0.01, 1000)
        
        this.app.renderSize.on('resize', this.resizeHandlerBound)
    }
    
    resizeHandler(info) {
        this.instance.aspect = info.aspect
        this.instance.updateProjectionMatrix()
        
        this.fovWidth = this.fovHeight * info.width / info.height        
    }    
    
    destroy() {
        this.app.renderSize.off('resize')
        this.resizeHandlerBound = null

        this.instance = null
        this.app = null        
    }
}