import { EventEmitter } from "./EventEmitter"


export class RenderSize extends EventEmitter {

    constructor() {
        super()

        /**
         * Render size properties
         */
        this.width = 0
        this.height = 0
        this.aspect = 1
        this.pixelRatio = 0
        
        /**
         * Bound event handlers
         */
        this.onResizeHandler = this.resizeHandler.bind(this)
        
        this.init()
    }
    
    init() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.aspect = this.width / this.height
        this.pixelRatio = Math.min(2, window.devicePixelRatio)
        
        window.addEventListener('resize', this.onResizeHandler)
    }
    
    resizeHandler() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.aspect = this.width / this.height
        this.pixelRatio = Math.min(2, window.devicePixelRatio)

        this.trigger('resize', [{
            width: this.width,
            height: this.height,
            aspect: this.aspect,
            pixelRatio: this.pixelRatio
        }])
    }
    
    destroy() {
        window.removeEventListener('resize', this.onResizeHandler)
        this.onResizeHandler = null
    }
}