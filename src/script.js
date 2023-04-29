import { App } from "./App"

const canvas = document.querySelector('canvas.webgl')
const prevBtn = document.querySelector('#prevBtn')
const nextBtn = document.querySelector('#nextBtn')

const app = new App(canvas)

prevBtn.addEventListener('click', () => {
    app.previousImage()   
})

nextBtn.addEventListener('click', () => {
    app.nextImage()
})
