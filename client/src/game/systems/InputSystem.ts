/**
 * InputSystem — tracks keyboard input for the game.
 * Listens to ArrowLeft, ArrowRight, Space.
 * Pure TS, no React dependency.
 */

export interface InputState {
  left: boolean
  right: boolean
  fire: boolean
}

const KEYS = {
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  FIRE: ['Space', 'KeyZ'],
}

export class InputSystem {
  private state: InputState = { left: false, right: false, fire: false }
  private listening: boolean = false

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (KEYS.LEFT.includes(e.code)) {
      e.preventDefault()
      this.state.left = true
    }
    if (KEYS.RIGHT.includes(e.code)) {
      e.preventDefault()
      this.state.right = true
    }
    if (KEYS.FIRE.includes(e.code)) {
      e.preventDefault()
      this.state.fire = true
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (KEYS.LEFT.includes(e.code)) this.state.left = false
    if (KEYS.RIGHT.includes(e.code)) this.state.right = false
    if (KEYS.FIRE.includes(e.code)) this.state.fire = false
  }

  /** Start listening for keyboard events */
  startListening(): void {
    if (this.listening) return
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.listening = true
  }

  /** Remove event listeners */
  stopListening(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.listening = false
    // Reset state on stop
    this.state = { left: false, right: false, fire: false }
  }

  /** Returns a snapshot of the current input state */
  getState(): InputState {
    return { ...this.state }
  }

  get isListening(): boolean {
    return this.listening
  }
}
