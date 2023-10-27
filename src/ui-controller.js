import {entity} from "./customEntity.js";
import {THREE} from "./threeD.js";


/**
 * @fileoverview This file defines the UIController class, which is responsible for managing the user interface of the game.
 * @class UIController
 * @extends {entity.Component}
 */
export const ui_controller = (() => {

  class UIController extends entity.Component {
    /**
     * Creates an instance of UIController.
     * @param {*} params - The parameters to be passed to the constructor.
     * @memberof UIController
     */
    constructor(params) {
      super();
    }

    /**
     * Initializes the component by registering the 'ui.charge' message handler.
     * @memberof UIController
     */
    InitComponent() {
      this.RegisterHandler_(
          'ui.charge', (m) => this.OnCharge_(m));

    }

    /**
     * Handles the 'ui.charge' message by updating the charge text and charge bar color and width.
     * @param {*} msg - The message to be handled.
     * @memberof UIController
     * @private
     */
    OnCharge_(msg) {
      const chargeText = document.getElementById('charge-text');
      chargeText.innerText = Math.ceil(msg.value * 100) + '%';

      const chargeBar = document.getElementById('charge-bar');
      const C1 = new THREE.Color('rgb(89, 241, 142)');
      const C2 = new THREE.Color('rgb(237, 50, 50)');
      const col = C2.clone();
      col.lerpHSL(C1, msg.value);
      chargeBar.style.backgroundColor = col.getStyle(); 
      chargeBar.style.width = chargeText.innerText;
    }
  };

  return {
    UIController: UIController,
  };

})();