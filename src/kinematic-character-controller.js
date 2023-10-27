import {THREE} from './threeD.js';

import {entity} from './customEntity.js';

export const kinematic_character_controller = (() => {

  // KinematicCharacterController class that manages the character's kinematic control
  class KinematicCharacterController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params; // Storing the parameters
    }

    // Destroy method to remove the rigid body from the physics
    Destroy() {
      this.FindEntity('physics').GetComponent('AmmoJSController').RemoveRigidBody(this.body_);
    }

    // Initialization of the entity with creation of the kinematic character controller
    InitEntity() {
      const pos = this.Parent.Position; // Get the position of the parent entity
      const quat = this.Parent.Quaternion; // Get the quaternion of the parent entity

      // Create a kinematic character controller for the entity
      this.body_ = this.FindEntity('physics').GetComponent('AmmoJSController').CreateKinematicCharacterController(
          pos, quat, {name: this.Parent.Name});

      // Setting the physics attribute for the parent entity
      this.Parent.Attributes.Physics = {
        CharacterController: this.body_,
      };
          
      this.Broadcast({topic: 'physics.loaded'}); // Broadcast that physics has been loaded
    }

    // Initialization of the component with event handler registration for position updates
    InitComponent() {
      this.RegisterHandler_('update.position', (m) => { this.OnPosition_(m); });
    }

    // Method to handle position changes based on received message
    OnPosition_(m) {
      this.OnTransformChanged_(); // Call transform change handler when position changes
    }

    // Method to handle changes in the transform of the entity
    OnTransformChanged_() {
      const pos = this.Parent.Position; // Get the current position of the entity
      const quat = this.Parent.Quaternion; // Get the current quaternion of the entity
      const t = this.body_.transform_; // Get the transform from the body

      this.body_.body_.getWorldTransform(t); // Get the world transform from the body

      // Set the new position values to the transform
      t.getOrigin().setValue(pos.x, pos.y, pos.z);
      this.body_.body_.setWorldTransform(t); // Set the world transform in the body
    }

  };

  return {
    KinematicCharacterController: KinematicCharacterController, // Export the KinematicCharacterController class
  };
})();
