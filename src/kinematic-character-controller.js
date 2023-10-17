
import {THREE} from './threeD.js';

import {entity} from './customEntity.js';


export const kinematic_character_controller = (() => {

  class KinematicCharacterController extends entity.Component {
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

      this.body_ = this.FindEntity('physics').GetComponent('CustomAmmoJSController').CreateKinematicCharacterController(
          pos, quat, {name: this.Parent.Name});

      this.Parent.Attributes.Physics = {
        CharacterController: this.body_,
      };
          
      this.BroadcastEvent({topic: 'physics.loaded'});
    }

    InitializeComponent() {
      this.addEventHandler_('update.position', (m) => { this.OnPosition_(m); });
    }

    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    OnTransformChanged_() {
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;
      const t = this.body_.transform_;
      
      this.body_.body_.getWorldTransform(t);

      t.getOrigin().setValue(pos.x, pos.y, pos.z);
      this.body_.body_.setWorldTransform(t);
    }

    // Update(timeElapsedS) {
    //   this.UpdateTranslation_(timeElapsedS);
    // }

    // UpdateTranslation_(timeElapsedS) {
    //   const input = this.GetComponent('PlayerInput');

    //   const forwardVelocity = (input.key(player_input.KEYS.w) ? 1 : 0) + (input.key(player_input.KEYS.s) ? -1 : 0)
    //   const strafeVelocity = (input.key(player_input.KEYS.a) ? 1 : 0) + (input.key(player_input.KEYS.d) ? -1 : 0)
    // }
  };

  return {
    KinematicCharacterController: KinematicCharacterController,
  };
})();