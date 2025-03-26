import * as THREE from 'three'
import { App } from './App'

export class TouchTexture {
    constructor(image) {
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

        this.touchRect = null

        this.pointerMoveHandlerBound = this.pointerMoveHandler.bind(this)

        this.init(image)
    }

    init(image) {
        this.app = new App()

        this.canvas = document.createElement('canvas')
        this.canvas.width = this.canvas.height = this.size
        this.canvas.style.width = this.canvas.style.height = this.size + 'px'

        this.updateTouchArea(image.image.width, image.image.height)

        if (this.app.debug.active === true) {
            const guiFTouch = this.app.debug.ui.addFolder("Touch Rect")
            guiFTouch.add(this.touchRect, 'x').min(0).max(this.app.canvas.width).step(1).listen()
            guiFTouch.add(this.touchRect, 'y').min(0).max(this.app.canvas.height).step(1)
            guiFTouch.add(this.touchRect, 'width').min(0).max(this.app.canvas.width).step(1)
            guiFTouch.add(this.touchRect, 'height').min(0).max(this.app.canvas.height).step(1)

            const touchP = {
                centerX : () => {
                    this.touchRect.x = (this.app.canvas.width - this.touchRect.width) / 2
                    console.log(this.touchRect.x)
                }
            }
            guiFTouch.add(touchP, 'centerX')

        }


        if (this.app.debug.active === true) {
            document.body.insertBefore(this.canvas, document.body.firstChild);
            this.canvas.style.position = "fixed"
            this.canvas.style.left = 300
            this.canvas.style.top = 700
        }

        this.ctx = this.canvas.getContext('2d')

        this.ctx.fillStyle = 'black'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.texture = new THREE.CanvasTexture(this.canvas)

        this.addEventHandlers()

        // Overlay to adjust rect boundaries
        if (this.app.debug.active === true) {
            this.overlay = document.createElement('canvas')

            document.body.insertBefore(this.overlay, document.body.firstChild);
            this.overlay.style.position = "fixed"
            this.overlay.style.left = '0px'
            this.overlay.style.top = '0px'
            this.overlay.style.zIndex = 999
            this.overlay.style.pointerEvents = "none"

            this.updateDebugOverlay()
        }
    }

    updateWithImage(image) {
        this.updateTouchArea(image.image.width, image.image.height)
    }

    updateTouchArea(width, height) {
        if (this.app.canvas === null) {
            return
        }

        const touchWidth = this.app.canvas.height * width / height
        
        this.touchRect = {
            x: (this.app.canvas.width - touchWidth) / 2,
            y: 0,
            width: touchWidth,
            height: this.app.canvas.height
        }
    }

    updateDebugOverlay() {
        this.overlay.style.left = this.touchRect.x + 'px'
        this.overlay.style.top = this.touchRect.y + 'px'

        this.overlay.width = this.touchRect.width
        this.overlay.height = this.touchRect.height
        this.overlay.style.width = this.touchRect.width + 'px'
        this.overlay.style.height = this.touchRect.height + 'px'

        this.overlayCtx = this.overlay.getContext('2d')
        this.overlayCtx.fillStyle = "rgba(200, 20, 200, 0.4)"
        this.overlayCtx.fillRect(0, 0, this.touchRect.width, this.touchRect.height)
    }

    setTouchRect(x, y, width, height) {
        this.touchRect = {x, y, width, height}
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
        // const x = (((source.clientX - r.x) / r.width - 0.5) * this.app.renderSize.aspect) + 0.5
        // const y = (source.clientY - r.y) / r.height

        const x = (source.clientX - this.touchRect.x) / this.touchRect.width
        const y = (source.clientY - this.touchRect.y) / this.touchRect.height

        // this.touchRect.x

        this.addPoint(new THREE.Vector2(x, y))
    }

    addPoint(uv) {
        const pt = new THREE.Vector2(uv.x, uv.y).multiplyScalar(this.size)
        this.points.push({x: pt.x, y: pt.y, ttl: this.ttl, power:1})

        // if (this.app.debug.active === true) {
        //     console.log("Pt: " + uv.x + ", " + uv.y)
        // }
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

        if (this.app.debug.active === true) {
            this.updateDebugOverlay()
        }
    }

    destroy() {
        this.removeEventHandlers()
        this.pointerMoveHandlerBound = null

        this.points.length = 0

        if (this.texture !== null) {
            this.texture.dispose()
            this.texture = null
        }

        this.touchRect = null
        this.ctx = null
        this.canvas = null
        this.app = null
    }
}