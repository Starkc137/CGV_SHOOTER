import {THREE} from './threeD.js';
import {entity} from './customEntity.js';

// Define and export the basic_rigid_body module
export const basic_rigid_body = (() => {

  // Define the BasicRigidBody class that extends the entity component
  class BasicRigidBody extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    // Remove the entity
    removeEntity() {
      this.FindEntity('physics').GetComponent('CustomAmmoJSController').RemoveRigidBody(this.body_);
    }

    // Initialize the entity
    InitializeEntity() {
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;

      this.body_ = this.FindEntity('physics').GetComponent('CustomAmmoJSController').CreateBox(
          pos, quat, this.params_.box, {name: this.Parent.Name});

      if (this.params_.scene) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        this.debug_ = new THREE.Mesh(geometry, material);
        this.debug_.scale.copy(this.params_.box);
        this.params_.scene.add(this.debug_);
      }

      this.Parent.Attributes.roughRadius = Math.max(
          this.params_.box.x,
          Math.max(this.params_.box.y, this.params_.box.z));
      this.BroadcastEvent({topic: 'physics.loaded'});
    }

    // Initialize the component
    InitializeComponent() {
      this.addEventHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.addEventHandler_('update.rotation', (m) => { this.OnRotation_(m); });
      this.addEventHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    // Handle collision events
    OnCollision_() {
    }

    // Handle position changes
    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    // Handle rotation changes
    OnRotation_(m) {
      this.OnTransformChanged_();
    }

    // Update the transform
    OnTransformChanged_() {
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;
      const ms = this.body_.motionState_;
      const t = this.body_.transform_;
      
      ms.getWorldTransform(t);
      t.setIdentity();
      t.getOrigin().setValue(pos.x, pos.y, pos.z);
      t.getRotation().setValue(quat.x, quat.y, quat.z, quat.w);
      ms.setWorldTransform(t);

      if (this.debug_) {
        const origin = pos;
        this.debug_.position.copy(origin);
        this.debug_.quaternion.copy(quat);
      }
    }

    // Update the component
    Update(_) {
    }
  };

  // Define the CharacterRigidBody class that extends the entity component
  class CharacterRigidBody extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.box_ = new THREE.Box3();
    }

    // Remove the entity
    removeEntity() {
      this.FindEntity('physics').GetComponent('CustomAmmoJSController').RemoveRigidBody(this.body_);
    }

    // Initialize the entity
    InitializeEntity() {
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;

      this.body_ = this.FindEntity('physics').GetComponent('CustomAmmoJSController').CreateBox(
          pos, quat, this.params_.box, {name: this.Parent.Name});

      if (this.params_.scene) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        this.debug_ = new THREE.Mesh(geometry, material);
        this.debug_.scale.copy(this.params_.box);
        this.params_.scene.add(this.debug_);
      }

      this.Parent.Attributes.roughRadius = Math.max(
          this.params_.box.x,
          Math.max(this.params_.box.y, this.params_.box.z));
      this.BroadcastEvent({topic: 'physics.loaded'});
    }

    // Initialize the component
    InitializeComponent() {
      this.addEventHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.addEventHandler_('update.rotation', (m) => { this.OnRotation_(m); });
      this.addEventHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    // Handle collision events
    OnCollision_() {
    }

    // Handle position changes
    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    // Handle rotation changes
    OnRotation_(m) {
      this.OnTransformChanged_();
    }

    // Update the transform
    OnTransformChanged_() {
      this.box_.setFromObject(this.Parent.Attributes.Render.group);

      const quat = this.Parent.Quaternion;
      const ms = this.body_.motionState_;
      const t = this.body_.transform_;
      const pos = this.Parent.Position;

      if (!this.box_.isEmpty()) {
        this.box_.getCenter(pos);
      }

      ms.getWorldTransform(t);
      t.setIdentity();
      t.getOrigin().setValue(pos.x, pos.y, pos.z);
      t.getRotation().setValue(quat.x, quat.y, quat.z, quat.w);
      ms.setWorldTransform(t);

      if (this.debug_) {
        const origin = pos;
        this.debug_.position.copy(origin);
        this.debug_.quaternion.copy(quat);
      }
    }

    // Update the component
    Update(_) {
    }
  };

  // Return the classes as exports
  return {
    BasicRigidBody: BasicRigidBody,
    CharacterRigidBody: CharacterRigidBody,
  };
})();
