// Import necessary components and modules
import {THREE} from './threeD.js';

// Define and export the player_state module
export const player_state = (() => {

  // Define the base State class
  class State {
    constructor(parent) {
      this._parent = parent;
    }
  
    // Methods to be overridden by subclasses
    Enter() {}
    Exit() {}
    Update() {}
  };

  // Define the DeathState class
  class DeathState extends State {
    constructor(parent) {
      super(parent);
  
      this._action = null;
    }
  
    // Getter for the state name
    get Name() {
      return 'death';
    }
  
    // Method to handle state entry
    Enter(prevState) {
      // Initialize the death action and its parameters
      this._action = this._parent._proxy.animations['death'].action;

      this._action.reset();  
      this._action.setLoop(THREE.LoopOnce, 1);
      this._action.clampWhenFinished = true;

      if (prevState) {
        const prevAction = this._parent._proxy.animations[prevState.Name].action;
  
        this._action.crossFadeFrom(prevAction, 0.2, true);
        this._action.play();
      } else {
        this._action.play();
      }
    }
  
    Exit() {
    }
  
    Update(_) {
    }
  };

  // Define the AttackState class
  class AttackState extends State {
    constructor(parent) {
      super(parent);
  
      this._action = null;
  
      this._FinishedCallback = () => {
        this._Finished();
      }
    }
  
    // Getter for the state name
    get Name() {
      return 'attack';
    }
  
    // Method to handle state entry
    Enter(prevState) {
      // Initialize the attack action and set event listeners
      this._action = this._parent._proxy.animations['attack'].action;
      const mixer = this._action.getMixer();
      mixer.addEventListener('finished', this._FinishedCallback);
  
      if (prevState) {
        const prevAction = this._parent._proxy.animations[prevState.Name].action;
  
        this._action.reset();  
        this._action.setLoop(THREE.LoopOnce, 1);
        this._action.clampWhenFinished = true;
        this._action.crossFadeFrom(prevAction, 0.4, true);
        this._action.play();
      } else {
        this._action.play();
      }
    }
  
    // Method to handle the finishing of the attack action
    _Finished() {
      this._Cleanup();
      this._parent.SetState('idle');
    }
  
    // Method to clean up the action and event listeners
    _Cleanup() {
      if (this._action) {
        this._action.getMixer().removeEventListener('finished', this._FinishedCallback);
      }
    }
  
    Exit() {
      this._Cleanup();
    }
  
    Update(_) {
    }
  };
  
  // Define the WalkState class
  class WalkState extends State {
    constructor(parent) {
      super(parent);
    }
  
    // Getter for the state name
    get Name() {
      return 'walk';
    }
  
    // Method to handle state entry
    Enter(prevState) {
      // Handle the entry logic for the walk state
      const curAction = this._parent._proxy.animations['walk'].action;
      if (prevState) {
        const prevAction = this._parent._proxy.animations[prevState.Name].action;
  
        curAction.enabled = true;
  
        if (prevState.Name == 'run') {
          const ratio = curAction.getClip().duration / prevAction.getClip().duration;
          curAction.time = prevAction.time * ratio;
        } else {
          curAction.time = 0.0;
          curAction.setEffectiveTimeScale(1.0);
          curAction.setEffectiveWeight(1.0);
        }
  
        curAction.crossFadeFrom(prevAction, 0.1, true);
        curAction.play();
      } else {
        curAction.play();
      }
    }
  
    Exit() {
    }
  
    // Method to handle state updates
    Update(timeElapsed, input) {
      // Check for input and transition to other states accordingly
      if (!input) {
        return;
      }
  
      if (input._keys.forward || input._keys.backward) {
        if (input._keys.shift) {
          this._parent.SetState('run');
        }
        return;
      }
  
      this._parent.SetState('idle');
    }
  };
  
  // Define the RunState class
  class RunState extends State {
    constructor(parent) {
      super(parent);
    }
  
    // Getter for the state name
    get Name() {
      return 'run';
    }
  
    // Method to handle state entry
    Enter(prevState) {
      // Handle the entry logic for the run state
      const curAction = this._parent._proxy.animations['run'].action;
      if (prevState) {
        const prevAction = this._parent._proxy.animations[prevState.Name].action;
  
        curAction.enabled = true;
  
        if (prevState.Name == 'walk') {
          const ratio = curAction.getClip().duration / prevAction.getClip().duration;
          curAction.time = prevAction.time * ratio;
        } else {
          curAction.time = 0.0;
          curAction.setEffectiveTimeScale(1.0);
          curAction.setEffectiveWeight(1.0);
        }
  
        curAction.crossFadeFrom(prevAction, 0.1, true);
        curAction.play();
      } else {
        curAction.play();
      }
    }
  
    Exit() {
    }
  
    // Method to handle state updates
    Update(timeElapsed, input) {
      // Check for input and transition to other states accordingly
      if (!input) {
        return;
      }

      if (input._keys.forward || input._keys.backward) {
        if (!input._keys.shift) {
          this._parent.SetState('walk');
        }
        return;
      }
  
      this._parent.SetState('idle');
    }
  };
  
  // Define the IdleState class
  class IdleState extends State {
    constructor(parent) {
      super(parent);
    }
  
    // Getter for the state name
    get Name() {
      return 'idle';
    }
  
    // Method to handle state entry
    Enter(prevState) {
      // Handle the entry logic for the idle state
      const idleAction = this._parent._proxy.animations['idle'].action;
      if (prevState) {
        const prevAction = this._parent._proxy.animations[prevState.Name].action;
        idleAction.time = 0.0;
        idleAction.enabled = true;
        idleAction.setEffectiveTimeScale(1.0);
        idleAction.setEffectiveWeight(1.0);
        idleAction.crossFadeFrom(prevAction, 0.25, true);
        idleAction.play();
      } else {
        idleAction.play();
      }
    }
  
    Exit() {
    }
  
    // Method to handle state updates
    Update(_, input) {
      // Check for input and transition to other states accordingly
      if (!input) {
        return;
      }
  
      if (input._keys.forward || input._keys.backward) {
        this._parent.SetState('walk');
      } else if (input._keys.space) {
        this._parent.SetState('attack');
      } else if (input._keys.backspace) {
        this._parent.SetState('dance');
      }
    }
  };

  // Expose the State and different state classes
  return {
    State: State,
    AttackState: AttackState,
    IdleState: IdleState,
    WalkState: WalkState,
    RunState: RunState,
    DeathState: DeathState,
  };

})();
