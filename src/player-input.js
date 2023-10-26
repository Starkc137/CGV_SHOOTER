import {entity} from "./customEntity.js";
import {passes} from './passes.js';


export const player_input = (() => {

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

  class PlayerInput extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    InitializeEntity() {
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

    onMouseMove_(e) {
      this.current_.mouseX = e.pageX - window.innerWidth / 2;
      this.current_.mouseY = e.pageY - window.innerHeight / 2;

      if (this.previous_ === null) {
        this.previous_ = {...this.current_};
      }

      this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
      this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
    }

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

    onKeyDown_(e) {
      // super.onKeyDown_(e);

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

    onKeyUp_(e) {
      this.keys_[e.keyCode] = false;
    }

    key(keyCode) {
      return !!this.keys_[keyCode];
    }

    mouseLeftReleased(checkPrevious=true) {
      return (!this.current_.leftButton && this.previous_.leftButton);
    }

    isReady() {
      return this.previous_ !== null;
    }

    Update(_) {
      if(this.paused !==null && this.paused){
        this.mouseX = 0;
        this.mouseY = 0;
        this.previous_ = null;
        this.keys_ = {};
        this.previousKeys_ = {};
        this.target_ = document;
      }
      else if (this.previous_ !== null && !this.paused) {
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