import { EventEmitter } from './EventEmitter.js'

export class AnimationLoop extends EventEmitter {
    
    constructor() {
        super()
        
        /**
         * Timestamps [s]
        */
        this.startTS = 0
        this.currentTS = 0
        
        /**
         * Animation loop state
        */
       this.running = false

       /**
        * Animation loop properties [s]
        */
       this.elapsed = 0
       this.delta = 0       
    }
    
    start() {
        this.running = true

        this.startTS = Date.now() / 1000
        this.currentTS = this.startTS
        
        window.requestAnimationFrame(() => {
            this.tick()
        })
    }

    stop() {
        this.running = false
    }

    tick() {
        if (this.running === true) {
            window.requestAnimationFrame(() => {
                this.tick()
            })
        }

        const currentTime = Date.now() / 1000
        this.delta = currentTime - this.currentTS
        this.currentTS = currentTime
        this.elapsed = this.currentTS - this.startTS
                
        this.trigger('tick', [{elapsed: this.elapsed, delta: this.delta}])
    }

    destroy() {
    }
}


