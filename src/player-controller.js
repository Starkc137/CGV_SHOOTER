// Import necessary components and modules
import {THREE} from './three-defs.js';
import {entity} from './customEntity.js';
import {math} from './math.js';

// Define and export the player_controller module
export const player_controller = (() => {

  // Define the PlayerController class
  class PlayerController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.dead_ = false; // Flag to track player status
    }

    // Initialize the component
    InitComponent() {
      // Register collision handler
      this.RegisterHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    // Initialize the entity
    InitEntity() {
      // Define decceleration and acceleration vectors for player movement
      this.decceleration_ = new THREE.Vector3(-0.0005, -0.0001, -1);
      this.acceleration_ = new THREE.Vector3(100, 0.5, 25000);
      this.velocity_ = new THREE.Vector3(0, 0, 0);
    }

    // Handle collision events
    OnCollision_() {
      if (!this.dead_) {
        this.dead_ = true; // Player is marked as dead
        console.log('EXPLODE ' + this.Parent.Name); // Log explosion event
        this.Broadcast({topic: 'health.dead'}); // Broadcast health.dead event
      }
    }

    // Handle firing events
    Fire_() {
      this.Broadcast({
          topic: 'player.fire' // Broadcast player.fire event
      });
    }

    // Update method to handle player movement and actions
    Update(timeInSeconds) {
      if (this.dead_) {
        return; // If the player is dead, do not update
      }

      const input = this.Parent.Attributes.InputCurrent; // Get current input

      if (!input) {
        return; // If there's no input, do not update
      }

      const velocity = this.velocity_; // Get the player's current velocity
      const frameDecceleration = new THREE.Vector3(
          velocity.x * this.decceleration_.x,
          velocity.y * this.decceleration_.y,
          velocity.z * this.decceleration_.z
      );
      frameDecceleration.multiplyScalar(timeInSeconds);

      velocity.add(frameDecceleration);
      velocity.z = -math.clamp(Math.abs(velocity.z), 50.0, 125.0);
      // Handle player movement and rotation based on input
      const _PARENT_Q = this.Parent.Quaternion.clone();
      const _PARENT_P = this.Parent.Position.clone();

      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = _PARENT_Q.clone();
  
      const acc = this.acceleration_.clone();
      if (input.shift) {
        acc.multiplyScalar(2.0);
      }
  
      if (input.axis1Forward) {
        _A.set(1, 0, 0);
        _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * acc.y * input.axis1Forward);
        _R.multiply(_Q);
      }
      if (input.axis1Side) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * acc.y * input.axis1Side);
        _R.multiply(_Q);
      }
      if (input.axis2Side) {
        _A.set(0, 0, -1);
        _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * acc.y * input.axis2Side);
        _R.multiply(_Q);
      }
  
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(_PARENT_Q);
      forward.normalize();
  
      const updown = new THREE.Vector3(0, 1, 0);
      updown.applyQuaternion(_PARENT_Q);
      updown.normalize();

      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(_PARENT_Q);
      sideways.normalize();
  
      sideways.multiplyScalar(velocity.x * timeInSeconds);
      updown.multiplyScalar(velocity.y * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);
  
      const pos = _PARENT_P;
      pos.add(forward);
      pos.add(sideways);
      pos.add(updown);

      this.Parent.SetPosition(pos);
      this.Parent.SetQuaternion(_R);

      if (input.space) {
        this.Fire_(); // If the space key is pressed, fire the weapon
      }
    }
  };
  
  return {
    PlayerController: PlayerController,
  };

})();