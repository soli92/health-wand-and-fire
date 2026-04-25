/**
 * GameLoop — fixed timestep game loop using requestAnimationFrame.
 * Targets 60fps (16.667ms per tick). Pure TS, no React dependency.
 */

const TARGET_FPS = 60
const FIXED_DT = 1000 / TARGET_FPS // ~16.667ms
const MAX_FRAME_TIME = 250 // cap to avoid spiral-of-death

type UpdateCallback = (dt: number) => void
type RenderCallback = () => void

export class GameLoop {
  private rafId: number | null = null
  private lastTime: number = 0
  private accumulator: number = 0
  private running: boolean = false

  private updateCallback: UpdateCallback | null = null
  private renderCallback: RenderCallback | null = null

  /** Register the update function called at fixed timestep (dt in ms) */
  setUpdateCallback(fn: UpdateCallback): void {
    this.updateCallback = fn
  }

  /** Register the render function called once per frame */
  setRenderCallback(fn: RenderCallback): void {
    this.renderCallback = fn
  }

  /** Start the loop */
  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this.rafId = requestAnimationFrame(this.tick)
  }

  /** Stop the loop and cancel any pending frame */
  stop(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  get isRunning(): boolean {
    return this.running
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return

    let frameTime = timestamp - this.lastTime
    // Clamp to avoid huge dt spikes after tab switching
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME
    this.lastTime = timestamp
    this.accumulator += frameTime

    // Fixed update steps
    while (this.accumulator >= FIXED_DT) {
      this.updateCallback?.(FIXED_DT)
      this.accumulator -= FIXED_DT
    }

    // Render once per frame
    this.renderCallback?.()

    this.rafId = requestAnimationFrame(this.tick)
  }
}
