import * as dat from 'lil-gui'
import * as Stats from 'stats.js'

import { App } from '../App'

export class Debug {
    constructor() {

        this.active = window.location.hash === '#debug'

        this.app = null
        this.beforeUpdateHandlerBound = this.beforeUpdateHandler.bind(this)
        this.afterUpdateHandlerBound = this.afterUpdateHandler.bind(this)

        this.ui = null
        this.stats = null
        
        if (this.active) {
            this.init()
        }
    }
    
    init() {
        this.app = new App()
        
        this.ui = new dat.GUI({
            width: 350
        })

        this.ui.close()
        
        this.stats = new Stats()
        // document.body.appendChild(this.stats.dom)

        this.app.on('beforeUpdate', this.beforeUpdateHandlerBound)
        this.app.on('afterUpdate', this.beforeUpdateHandlerBound)
    }

    update() {
        if (this.stats !== null) {
            this.stats.update()
        }
    }
    
    beforeUpdateHandler() {
        this.stats.begin()
    }
    
    afterUpdateHandler() {
        this.stats.end()
    }

    destroy() {
        this.app.off('beforeUpdate')
        this.app.off('afterUpdate')

        this.beforeUpdateHandlerBound = null
        this.afterUpdateHandlerBound = null

        this.ui.destroy()
        this.ui = null
        
        this.stats.dom.parentElement.removeChild(this.stats.dom)
        this.stats = null

        this.app = null
    }
}