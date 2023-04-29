import * as THREE from 'three'
import { App } from './App'

export class TouchTexture {
    constructor() {
        this.app = null

        this.ttl = 2 // s
        this.size = 32
        this.radius = 5

        this.canvas = null
        this.ctx = null
        this.texture = null
        this.points = []

        this.rampDuration = 0
        this.rampTime = 0

        this.pointerMoveHandlerBound = this.pointerMoveHandler.bind(this)

        this.init()
    }

    init() {
        this.app = new App()

        this.canvas = document.createElement('canvas')
        this.canvas.width = this.canvas.height = this.size
        this.canvas.style.width = this.canvas.style.height = this.size + 'px'

        // Debug
        if (this.app.debug.active === true) {
            document.body.appendChild(this.canvas)
            this.canvas.style.position = "fixed"
            this.canvas.style.left = 300
            this.canvas.style.top = 700
        }

        this.ctx = this.canvas.getContext('2d')

        this.ctx.fillStyle = 'black'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.texture = new THREE.CanvasTexture(this.canvas)

        this.addEventHandlers()
    }

    addEventHandlers() {
        this.app.canvas.addEventListener('pointermove', this.pointerMoveHandlerBound)
        this.app.canvas.addEventListener('touchmove', this.pointerMoveHandlerBound)
    }

    removeEventHandlers() {
        this.app.canvas.removeEventListener('pointermove', this.pointerMoveHandlerBound)
        this.app.canvas.removeEventListener('touchmove', this.pointerMoveHandlerBound)
    }

    pointerMoveHandler(event) {
        if (this.touchTexture === null) {
            return
        }

        let source = event
        if (event instanceof TouchEvent) {
            source = event.touches[0]
        }

        const r = event.target.getBoundingClientRect()
        const x = (((source.clientX - r.x) / r.width - 0.5) * this.app.renderSize.aspect) + 0.5
        const y = (source.clientY - r.y) / r.height

        this.addPoint(new THREE.Vector2(x, y))
    }


    addPoint(uv) {
        const pt = new THREE.Vector2(uv.x, uv.y).multiplyScalar(this.size)
        this.points.push({x: pt.x, y: pt.y, ttl: this.ttl, power:1})
    }

    drawPoint(pt) {
        pt.power = pt.ttl / this.ttl

        const gradient = this.ctx.createRadialGradient(pt.x, pt.y, this.radius * 0.2, pt.x, pt.y, this.radius)

        gradient.addColorStop(0, '#000000')
        gradient.addColorStop(1, '#ffffff')

        this.ctx.beginPath()
        this.ctx.fillStyle = gradient
		this.ctx.arc(pt.x, pt.y, this.radius * pt.power, 0, Math.PI * 2)
		this.ctx.fill()
    }

    startRamp(duration) {
        this.rampDuration = duration
        this.rampTime = 0
    }

    updateRamp(delta) {
        const tn = this.rampTime / this.rampDuration
        const color = new THREE.Color().setHSL(0, 0, 1 - tn).getStyle()

        this.ctx.fillStyle = color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.rampTime += delta

        if (this.rampTime >= this.rampDuration) {
            this.rampDuration = 0
            this.rampColorFrom = null
            this.rampColorTo = null
            this.rampCanvas = null
        }
    }

    update(delta) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        if (this.rampDuration !== 0) {
            this.updateRamp(delta)
        }
        else {
            this.points.forEach((point, idx, points) => {
                this.drawPoint(point)

                point.ttl -= delta
                if (point.ttl <= 0) {
                    points.splice(idx, 1)
                }
            })
        }

        this.texture.needsUpdate = true
    }

    destroy() {
        this.removeEventHandlers()
        this.pointerMoveHandlerBound = null

        this.points.length = 0

        if (this.texture !== null) {
            this.texture.dispose()
            this.texture = null
        }

        this.ctx = null
        this.canvas = null
        this.app = null
    }
}