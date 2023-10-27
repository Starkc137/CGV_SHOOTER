/**
 * A module that exports a FiniteStateMachine class.
 * @module finite_state_machine
 */

export const finite_state_machine = (() => {

  /**
   * A class representing a finite state machine.
   * @class
   */
  class FiniteStateMachine {
    constructor() {
      /**
       * An object containing all the states of the finite state machine.
       * @type {Object}
       * @private
       */
      this._states = {};
      /**
       * The current state of the finite state machine.
       * @type {Object}
       * @private
       */
      this._currentState = null;
    }

    /**
     * Adds a state to the finite state machine.
     * @param {string} name - The name of the state.
     * @param {Object} type - The type of the state.
     * @private
     */
    _AddState(name, type) {
      this._states[name] = type;
    }

    /**
     * Gets the name of the current state.
     * @type {string}
     * @readonly
     */
    get State() {
      return this._currentState.Name;
    }

    /**
     * Sets the current state of the finite state machine.
     * @param {string} name - The name of the state to set.
     */
    SetState(name) {
      const prevState = this._currentState;
      
      if (prevState) {
        if (prevState.Name == name) {
          return;
        }
        prevState.Exit();
      }

      const state = new this._states[name](this);

      this._currentState = state;
      state.Enter(prevState);
    }

    /**
     * Updates the current state of the finite state machine.
     * @param {number} timeElapsed - The time elapsed since the last update.
     * @param {Object} input - The input to the finite state machine.
     */
    Update(timeElapsed, input) {
      if (this._currentState) {
        this._currentState.Update(timeElapsed, input);
      }
    }
  };

  return {
    FiniteStateMachine: FiniteStateMachine
  };

})();