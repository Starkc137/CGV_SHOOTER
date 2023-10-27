import {entity} from "./customEntity.js";
import {passes} from './passes.js';


/**
 * This module exports a PlayerInput class and a KEYS object.
 * The PlayerInput class handles user input from the keyboard and mouse.
 * The KEYS object maps key names to their corresponding key codes.
 * @module player_input
 */

export const player_input = (() => {

  /**
   * Maps key names to their corresponding key codes.
   * @constant {Object.<string, number>}
   */
  const KEYS = {
    'a': 65,
    's': 83,
    'w': 87,
    'd': 68,
    'SPACE': 32,
    'SHIFT_L': 16,
    'CTRL_L': 17,
    'Escape':27,
  };

  /**
   * Handles user input from the keyboard and mouse.
   * @memberof module:player_input
   */
  class PlayerInput extends entity.Component {
    /**
     * Creates a PlayerInput instance.
     * @param {Object} params - The parameters for the component.
     */
    constructor(params) {
      super();
      this.params_ = params;
    }

    /**
     * Initializes the component.
     * @override
     */
    InitEntity() {
      this.current_ = {
        leftButton: false,
        rightButton: false,
        mouseXDelta: 0,
        mouseYDelta: 0,
        mouseX: 0,
        mouseY: 0,
      };
      this.previous_ = null;
      this.keys_ = {};
      this.previousKeys_ = {};
      this.target_ = document;
      this.target_.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
      this.target_.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
      this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
      this.target_.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
      this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e), false);

      this.Parent.Attributes.Input = {
        Keyboard: {
          Current: this.keys_,
          Previous: this.previousKeys_
        },
        Mouse: {
          Current: this.current_,
          Previous: this.previous_
        },
      };

      this.SetPass(passes.INPUT);
    }

    /**
     * Handles mouse movement events.
     * @param {MouseEvent} e - The mouse event.
     * @private
     */
    onMouseMove_(e) {
      this.current_.mouseX = e.pageX - window.innerWidth / 2;
      this.current_.mouseY = e.pageY - window.innerHeight / 2;

      if (this.previous_ === null) {
        this.previous_ = {...this.current_};
      }

      this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
      this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
    }

    /**
     * Handles mouse button down events.
     * @param {MouseEvent} e - The mouse event.
     * @private
     */
    onMouseDown_(e) {
      this.onMouseMove_(e);

      switch (e.button) {
        case 0: {
          this.current_.leftButton = true;
          break;
        }
        case 2: {
          this.current_.rightButton = true;
          break;
        }
      }
    }

    /**
     * Handles mouse button up events.
     * @param {MouseEvent} e - The mouse event.
     * @private
     */
    onMouseUp_(e) {
      this.onMouseMove_(e);

      switch (e.button) {
        case 0: {
          this.current_.leftButton = false;
          break;
        }
        case 2: {
          this.current_.rightButton = false;
          break;
        }
      }
    }

    /**
     * Handles key down events.
     * @param {KeyboardEvent} e - The keyboard event.
     * @private
     */
    onKeyDown_(e) {
      if(e.key ==='Escape' && this.paused){
        this.togglePause();
        document.getElementById('menu').style.display = 'none';
      }
      else if(e.key === 'Escape' && !this.paused){
        document.getElementById('menu').style.display = 'initial';
        this.togglePause();
        // Register remove onClick
       play_button.innerHTML = "ESC to play";
       play_button.style.fontSize = "15px";
       play_button.disabled = true;
      }
      else if(!this.paused)
      this.keys_[e.keyCode] = true;
    }

    /**
     * Handles key up events.
     * @param {KeyboardEvent} e - The keyboard event.
     * @private
     */
    onKeyUp_(e) {
      this.keys_[e.keyCode] = false;
    }

    /**
     * Returns whether a key is currently pressed.
     * @param {number} keyCode - The key code.
     * @returns {boolean} Whether the key is currently pressed.
     */
    key(keyCode) {
      return !!this.keys_[keyCode];
    }

    /**
     * Returns whether the left mouse button was released.
     * @param {boolean} [checkPrevious=true] - Whether to check the previous state of the button.
     * @returns {boolean} Whether the left mouse button was released.
     */
    mouseLeftReleased(checkPrevious=true) {
      return (!this.current_.leftButton && this.previous_.leftButton);
    }

    /**
     * Returns whether the component is ready.
     * @returns {boolean} Whether the component is ready.
     */
    isReady() {
      return this.previous_ !== null;
    }

    /**
     * Updates the component.
     * @param {number} _ - The delta time.
     * @override
     */
    Update(_) {
      if(this.paused !==null && this.paused){
        this.mouseX = 0;
        this.mouseY = 0;
        this.previous_ = null;
        this.keys_ = {};
        this.previousKeys_ = {};
        this.target_ = document;
      }
      else if (this.previous_ !== null) {
        this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
        this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

        this.previous_ = {...this.current_};
        this.previousKeys_ = {...this.keys_};
      }
    }
  };

  return {
    PlayerInput: PlayerInput,
    KEYS: KEYS,
  };

})();