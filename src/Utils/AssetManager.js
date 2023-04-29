import * as THREE from 'three'
import { EventEmitter } from "./EventEmitter";

export class AssetManager extends EventEmitter {
    constructor(assets) {
        super()
        
        this.assets = assets

        this.loaders = null
        this.items = null
        this.loadingCount = assets.length
        this.loadedCount = 0

        this.init()
    }
    
    init() {
        this.items = {}

        this.loaders = {}
        this.loaders.texture = new THREE.TextureLoader()
    }
    
    startLoading() {
        for (const asset of this.assets) {
            if (asset.type.toLowerCase() === "texture") {
                this.loaders.texture.load(asset.path, (texture) => {
                    this.loadComplete(asset, texture)
                })
            }
        }
    }

    loadComplete(asset, object) {
        this.items[asset.name] = object

        if (++this.loadedCount === this.loadingCount) {
            this.trigger('ready')
        }
    }

    getItemNamesOfType(type) {
        return this.assets.filter(asset => asset.type.toLowerCase() === type.toLowerCase()).map(e => e.name)
    }

    getItem(name) {
        return this.items[name]
    }

    destroy() {
        this.assets = null
        this.loaders = null

        this.items.length = 0
        this.items = null    
    }
}