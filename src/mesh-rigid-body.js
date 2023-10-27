import {THREE} from './threeD.js';

import {entity} from './customEntity.js';

export const mesh_rigid_body = (() => {

  class MeshRigidBody extends entity.Component {
    constructor(params) {
      super();
      this.group_ = new THREE.Group();
      this.params_ = params;
    }

    Destroy() {
      // Dispose of materials and geometries
      this.group_.traverse(c => {
        if (c.material) {
          c.material.dispose();
        }
        if (c.geometry) {
          c.geometry.dispose();
        }
      });
      this.params_.scene.remove(this.group_);
      // Remove the rigid body from the physics controller
      this.FindEntity('physics').GetComponent('AmmoJSController').RemoveRigidBody(this.body_);
    }

    InitEntity() {
      this._LoadModels();
    }
  
    _LoadModels() {
      const loader = this.FindEntity('loader').GetComponent('LoadController');
      loader.Load(
          this.params_.resourcePath, this.params_.resourceName, (mdl) => {
        this._OnLoaded(mdl);
      });
    }

    _OnLoaded(obj) {
      this.target_ = obj;
      this.group_.add(this.target_);
      this.group_.position.copy(this.Parent.Position);
      this.group_.quaternion.copy(this.Parent.Quaternion);

      // Create a basic green material
      const material = new THREE.MeshBasicMaterial({color: 0x00ff00});

      this.target_.scale.copy(this.params_.scale);
      this.target_.traverse(c => {
        if (c.geometry) {
          c.geometry.computeBoundingBox();
        }
        if (c.material) {
          c.material = material;
        }
      });

      this.Broadcast({
          topic: 'loaded.collision',
          value: this.target_,
      });
    }

    OnMeshLoaded_(msg) {
      // Create a rigid body from the loaded mesh
      const target = msg.value;
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;

      this.body_ = this.FindEntity('physics').GetComponent('AmmoJSController').CreateMesh(
          target, pos, quat, {name: this.Parent.Name});

      // Calculate the rough radius of the mesh and set it in the attributes
      const s = new THREE.Sphere();
      const b = new THREE.Box3().setFromObject(target);
      b.getBoundingSphere(s);
      this.Parent.Attributes.roughRadius = s.radius;

      this.OnTransformChanged_();
      this.Broadcast({topic: 'physics.loaded'});
    }

    InitComponent() {
      // Register event handlers for mesh loading and position/rotation updates
      this.RegisterHandler_('loaded.collision', (m) => this.OnMeshLoaded_(m) );
      this.RegisterHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.RegisterHandler_('update.rotation', (m) => { this.OnRotation_(m); });
    }

    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    OnRotation_(m) {
      this.OnTransformChanged_();
    }

    OnTransformChanged_() {
      // Update the rigid body and the group's position and rotation
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;
      const ms = this.body_.motionState_;
      const t = this.body_.transform_;

      ms.getWorldTransform(t);
      t.setIdentity();
      t.getOrigin().setValue(pos.x, pos.y, pos.z);
      t.getRotation().setValue(quat.x, quat.y, quat.z, quat.w);
      ms.setWorldTransform(t);

      const origin = pos;
      this.group_.position.copy(origin);
      this.group_.quaternion.copy(quat);
    }

    Update(_) {
    }
  };

  return {
    MeshRigidBody: MeshRigidBody,
  };
})();
