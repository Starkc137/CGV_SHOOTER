// Import necessary components and modules
import {entity} from "./customEntity.js";
import {passes} from './passes.js';

// Define and export the player_input module
export const player_input = (() => {

  // Define the key mappings for various keys
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

  // Define the PlayerInput class
  class PlayerInput extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    // Initialize the entity
    InitEntity() {
      // Initialize various input states and event listeners
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

      // Set initial input attributes
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

      this.SetPass(passes.INPUT); // Set the pass for input handling
    }

    // Event handler for mouse movement
    onMouseMove_(e) {
      // Update mouse coordinates and deltas
      this.current_.mouseX = e.pageX - window.innerWidth / 2;
      this.current_.mouseY = e.pageY - window.innerHeight / 2;

      if (this.previous_ === null) {
        this.previous_ = {...this.current_};
      }

      this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
      this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
    }

    // Event handler for mouse button press
    onMouseDown_(e) {
      this.onMouseMove_(e); // Update mouse coordinates

      switch (e.button) {
        case 0: {
          this.current_.leftButton = true; // Set leftButton to true for left mouse button press
          break;
        }
        case 2: {
          this.current_.rightButton = true; // Set rightButton to true for right mouse button press
          break;
        }
      }
    }

    // Event handler for mouse button release
    onMouseUp_(e) {
      this.onMouseMove_(e); // Update mouse coordinates

      switch (e.button) {
        case 0: {
          this.current_.leftButton = false; // Set leftButton to false for left mouse button release
          break;
        }
        case 2: {
          this.current_.rightButton = false; // Set rightButton to false for right mouse button release
          break;
        }
      }
    }

    // Event handler for key press
    onKeyDown_(e) {
      if(e.key ==='Escape' && this.paused){
        this.togglePause(); // Toggle the pause state
        document.getElementById('menu').style.display = 'none'; // Hide the menu
      }
      else if(e.key === 'Escape' && !this.paused){
        document.getElementById('menu').style.display = 'initial'; // Show the menu
        this.togglePause(); // Toggle the pause state
        // Register remove onClick
       play_button.innerHTML = "ESC to play"; // Update play_button text
       play_button.style.fontSize = "15px"; // Update play_button style
       play_button.disabled = true; // Disable the play_button
      }
      else if(!this.paused)
      this.keys_[e.keyCode] = true; // Set the corresponding key to true for key press
    }

    // Event handler for key release
    onKeyUp_(e) {
      this.keys_[e.keyCode] = false; // Set the corresponding key to false for key release
    }

    // Helper method to check the state of a key
    key(keyCode) {
      return !!this.keys_[keyCode]; // Return the state of the provided key
    }

    // Helper method to check if the left mouse button was released
    mouseLeftReleased(checkPrevious=true) {
      return (!this.current_.leftButton && this.previous_.leftButton); // Check and return the state of the left mouse button
    }

    // Helper method to check if the input is ready
    isReady() {
      return this.previous_ !== null; // Check and return if the input is ready
    }

    // Update method to handle input updates
    Update(_) {
      if(this.paused !==null && this.paused){
        // Reset input states if the game is paused
        this.mouseX = 0;
        this.mouseY = 0;
        this.previous_ = null;
        this.keys_ = {};
        this.previousKeys_ = {};
        this.target_ = document;
      }
      else if (this.previous_ !== null) {
        // Update mouse deltas and previous states
        this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
        this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

        this.previous_ = {...this.current_};
        this.previousKeys_ = {...this.keys_};
      }
    }
  };

  // Expose the PlayerInput class and KEYS mappings
  return {
    PlayerInput: PlayerInput,
    KEYS: KEYS,
  };

})();
