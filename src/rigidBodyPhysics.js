import {THREE} from './threeD.js';

import {entity} from './customEntity.js';


export const basic_rigid_body = (() => {

  class BasicRigidBody extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    removeEntity() {
      this.FindEntity('physics').GetComponent('CustomAmmoJSController').RemoveRigidBody(this.body_);
    }

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

    InitializeComponent() {
      this.addEventHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.addEventHandler_('update.rotation', (m) => { this.OnRotation_(m); });
      this.addEventHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    OnCollision_() {
    }

    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    OnRotation_(m) {
      this.OnTransformChanged_();
    }

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

    Update(_) {
    }
  };

  class CharacterRigidBody extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.box_ = new THREE.Box3();
    }

    removeEntity() {
      this.FindEntity('physics').GetComponent('CustomAmmoJSController').RemoveRigidBody(this.body_);
    }

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

    InitializeComponent() {
      this.addEventHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.addEventHandler_('update.rotation', (m) => { this.OnRotation_(m); });
      this.addEventHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    OnCollision_() {
    }

    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    OnRotation_(m) {
      this.OnTransformChanged_();
    }

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

    Update(_) {
    }
  };

  return {
    BasicRigidBody: BasicRigidBody,
    CharacterRigidBody: CharacterRigidBody,
  };
})();