// Import necessary modules and dependencies
import {entity} from "./customEntity.js";
import {THREE} from "./threeD.js";

// Define the ui_controller module
export const ui_controller = (() => {

  // Class for the UI controller component
  class UIController extends entity.Component {
    constructor(params) {
      super();
    }

    // Initialize the UI controller component
    InitComponent() {
      // Register the handler for the 'ui.charge' event
      // Call the OnCharge_ method when the 'ui.charge' event is triggered
      this.RegisterHandler_('ui.charge', (m) => this.OnCharge_(m));
    }

    // Update the charge text and bar based on the input charge value
    OnCharge_(msg) {
      // Get the charge text element by its ID
      const chargeText = document.getElementById('charge-text');
      // Set the charge text to the rounded charge value in percentage
      chargeText.innerText = Math.ceil(msg.value * 100) + '%';

      // Get the charge bar element by its ID
      const chargeBar = document.getElementById('charge-bar');
      
      // Define two colors for the charge bar
      const C1 = new THREE.Color('rgb(89, 241, 142)'); // Green color
      const C2 = new THREE.Color('rgb(237, 50, 50)'); // Red color

      // Create a new color based on the charge value, blending the two colors
      const col = C2.clone();
      col.lerpHSL(C1, msg.value);

      // Set the background color of the charge bar to the blended color
      chargeBar.style.backgroundColor = col.getStyle(); 

      // Set the width of the charge bar to the same value as the charge text
      chargeBar.style.width = chargeText.innerText;
    }
  };

  // Return the UIController class
  return {
    UIController: UIController,
  };

})();
