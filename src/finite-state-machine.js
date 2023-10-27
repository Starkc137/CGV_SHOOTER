// Define and export a finite_state_machine module within an IIFE (Immediately Invoked Function Expression) to encapsulate the code
export const finite_state_machine = (() => {

  // Define a class for implementing a finite state machine
  class FiniteStateMachine {
    constructor() {
      this._states = {}; // Initialize an empty object to store states
      this._currentState = null; // Initialize the current state as null
    }

    // Add a state to the state machine
    _AddState(name, type) {
      this._states[name] = type;
    }

    // Getter method for obtaining the current state's name
    get State() {
      return this._currentState.Name;
    }

    // Set the state of the finite state machine
    SetState(name) {
      const prevState = this._currentState; // Store the previous state
      
      // Check if the new state is the same as the previous state, and if so, return without making any changes
      if (prevState) {
        if (prevState.Name == name) {
          return;
        }
        prevState.Exit(); // Call the exit method of the previous state
      }

      const state = new this._states[name](this); // Create a new state instance

      this._currentState = state; // Update the current state
      state.Enter(prevState); // Call the enter method of the new state, passing the previous state as an argument
    }

    // Update the state machine with the elapsed time and input
    Update(timeElapsed, input) {
      if (this._currentState) {
        this._currentState.Update(timeElapsed, input); // Call the update method of the current state
      }
    }
  };

  // Return the finite state machine class
  return {
    FiniteStateMachine: FiniteStateMachine
  };

})();
