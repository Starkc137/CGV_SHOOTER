// Import necessary components and libraries from other files
import {THREE} from './threeD.js';
import {entity} from './customEntity.js';

// Define and export a basic_rigid_body module within an IIFE (Immediately Invoked Function Expression) to encapsulate the code
export const basic_rigid_body = (() => {

  // Define the BasicRigidBody class that extends the entity Component
  class BasicRigidBody extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    // Method to remove the rigid body
    Destroy() {
      this.FindEntity('physics').GetComponent('AmmoJSController').RemoveRigidBody(this.body_);
    }

    // Method to initialize the entity
    InitEntity() {
      // Set initial position and quaternion values
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;

      // Create a box-shaped rigid body using the AmmoJSController component
      this.body_ = this.FindEntity('physics').GetComponent('AmmoJSController').CreateBox(
          pos, quat, this.params_.box, {name: this.Parent.Name});

      // If there is a scene, create a visual representation of the rigid body using Three.js
      if (this.params_.scene) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        this.debug_ = new THREE.Mesh(geometry, material);
        this.debug_.scale.copy(this.params_.box);
        this.params_.scene.add(this.debug_);
      }

      // Set the roughRadius attribute of the parent entity
      this.Parent.Attributes.roughRadius = Math.max(
          this.params_.box.x,
          Math.max(this.params_.box.y, this.params_.box.z));
      
      // Broadcast the 'physics.loaded' event
      this.Broadcast({topic: 'physics.loaded'});
    }

    // Method to initialize the component
    InitComponent() {
      // Register event handlers for position updates, rotation updates, and collisions
      this.RegisterHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.RegisterHandler_('update.rotation', (m) => { this.OnRotation_(m); });
      this.RegisterHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    // Method to handle collision events
    OnCollision_() {
      // Implementation for handling collisions goes here
    }

    // Method to handle position updates
    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    // Method to handle rotation updates
    OnRotation_(m) {
      this.OnTransformChanged_();
    }

    // Method to handle changes in transform
    OnTransformChanged_() {
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;
      const ms = this.body_.motionState_;
      const t = this.body_.transform_;
      
      // Update the world transform of the motion state based on the entity's position and quaternion
      ms.getWorldTransform(t);
      t.setIdentity();
      t.getOrigin().setValue(pos.x, pos.y, pos.z);
      t.getRotation().setValue(quat.x, quat.y, quat.z, quat.w);
      ms.setWorldTransform(t);

      // Update the position and quaternion of the visual representation if it exists
      if (this.debug_) {
        const origin = pos;
        this.debug_.position.copy(origin);
        this.debug_.quaternion.copy(quat);
      }
    }

    // Method to update the component
    Update(_) {
      // Implementation for update logic goes here
    }
  };

  // Define the CharacterRigidBody class that extends the entity Component
  class CharacterRigidBody extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.box_ = new THREE.Box3(); // Initialize a Box3 object
    }

    // Method to remove the rigid body
    Destroy() {
      this.FindEntity('physics').GetComponent('AmmoJSController').RemoveRigidBody(this.body_);
    }

    // Method to initialize the entity
    InitEntity() {
      // Set initial position and quaternion values
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;

      // Create a box-shaped rigid body using the AmmoJSController component
      this.body_ = this.FindEntity('physics').GetComponent('AmmoJSController').CreateBox(
          pos, quat, this.params_.box, {name: this.Parent.Name});

      // If there is a scene, create a visual representation of the rigid body using Three.js
      if (this.params_.scene) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        this.debug_ = new THREE.Mesh(geometry, material);
        this.debug_.scale.copy(this.params_.box);
        this.params_.scene.add(this.debug_);
      }

      // Set the roughRadius attribute of the parent entity
      this.Parent.Attributes.roughRadius = Math.max(
          this.params_.box.x,
          Math.max(this.params_.box.y, this.params_.box.z));
      
      // Broadcast the 'physics.loaded' event
      this.Broadcast({topic: 'physics.loaded'});
    }

    // Method to initialize the component
    InitComponent() {
      // Register event handlers for position updates, rotation updates, and collisions
      this.RegisterHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.RegisterHandler_('update.rotation', (m) => { this.OnRotation_(m); });
      this.RegisterHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    // Method to handle collision events
    OnCollision_() {
      // Implementation for handling collisions goes here
    }

    // Method to handle position updates
    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    // Method to handle rotation updates
    OnRotation_(m) {
      this.OnTransformChanged_();
    }

    // Method to handle changes in transform
    OnTransformChanged_() {
      this.box_.setFromObject(this.Parent.Attributes.Render.group);

      const quat = this.Parent.Quaternion;
      const ms = this.body_.motionState_;
      const t = this.body_.transform_;
      const pos = this.Parent.Position;

      // Update the center of the box
      if (!this.box_.isEmpty()) {
        this.box_.getCenter(pos);
      }

      // Update the world transform of the motion state based on the entity's position and quaternion
      ms.getWorldTransform(t);
      t.setIdentity();
      t.getOrigin().setValue(pos.x, pos.y, pos.z);
      t.getRotation().setValue(quat.x, quat.y, quat.z, quat.w);
      ms.setWorldTransform(t);

      // Update the position and quaternion of the visual representation if it exists
      if (this.debug_) {
        const origin = pos;
        this.debug_.position.copy(origin);
        this.debug_.quaternion.copy(quat);
      }
    }

    // Method to update the component
    Update(_) {
      // Implementation for update logic goes here
    }
  };

  // Export the BasicRigidBody and CharacterRigidBody classes
  return {
    BasicRigidBody: BasicRigidBody,
    CharacterRigidBody: CharacterRigidBody,
  };
})();
