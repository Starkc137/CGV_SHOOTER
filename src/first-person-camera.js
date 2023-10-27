import {THREE} from './threeD.js';
import {entity} from './customEntity.js';
import {math} from './math.js';
import {player_input} from './player-input.js';
import {passes} from './passes.js';

export const first_person_camera = (() => {

  const POWER_TIME = 5; // Duration of power time in seconds
  const POWER_RECHARGE = 10; // Duration of power recharge in seconds

  class FirstPersonCamera extends entity.Component {
    constructor(params) {
      super();

      this.params_ = params; // Store the parameters
      this.camera_ = params.camera; // Reference to the camera
      this.group_ = new THREE.Group(); // Create a new group for the camera
      this.params_.scene.add(this.group_); // Add the group to the scene
    }

    Destroy() {
      this.params_.scene.remove(this.group_); // Remove the group from the scene upon destruction
    }

    InitEntity() {
      // Initialize various properties for handling rotation, translation, head bobbing, walk speed, and power
      this.rotation_ = new THREE.Quaternion();
      this.translation_ = new THREE.Vector3(0, 3, 0);
      this.phi_ = 0;
      this.phiSpeed_ = 8;
      this.theta_ = 0;
      this.thetaSpeed_ = 5;
      this.headBobActive_ = false;
      this.headBobTimer_ = 0;
      this.headBobSpeed_ = 15;
      this.headBobHeight_ = 0.01;
      this.walkSpeed_ = 10;
      this.strafeSpeed_ = 10;
      this.powerTime_ = 1;
      this.power_ = false;
      this.Parent.Attributes.FPSCamera = {
        group: this.group_
      };

      this.SetPass(passes.CAMERA); // Set the camera pass
    }

    Update(timeElapsedS) {
      // Call various update methods to handle rotation, camera, translation, head bobbing, and power
      this.updateRotation_(timeElapsedS);
      this.updateCamera_(timeElapsedS);
      this.updateTranslation_(timeElapsedS);
      this.updateHeadBob_(timeElapsedS);
      this.updatePower_(timeElapsedS);

      this.Parent.SetPosition(this.translation_); // Set the position of the parent entity
      this.Parent.SetQuaternion(this.rotation_); // Set the quaternion of the parent entity
    }
  
    // Update the camera position and rotation
    updateCamera_(_) {
      this.camera_.quaternion.copy(this.rotation_);
      this.camera_.position.copy(this.translation_);
      this.camera_.position.y += Math.sin(this.headBobTimer_ * this.headBobSpeed_) * this.headBobHeight_;
      this.group_.position.copy(this.translation_);
      this.group_.quaternion.copy(this.rotation_);
    }
  
    // Update the head bobbing motion
    updateHeadBob_(timeElapsedS) {
      if (this.headBobActive_) {
        const wavelength = Math.PI;
        const nextStep = 1 + Math.floor(((this.headBobTimer_ + 0.000001) * this.headBobSpeed_) / wavelength);
        const nextStepTime = nextStep * wavelength / this.headBobSpeed_;
        this.headBobTimer_ = Math.min(this.headBobTimer_ + timeElapsedS, nextStepTime);
  
        if (this.headBobTimer_ == nextStepTime) {
          this.headBobActive_ = false;
          this.Broadcast({
            topic: 'fps.step',
            step: nextStep,
          });
        }
      }
    }
  
    // Update the translation based on the player's input
    updateTranslation_(timeElapsedS) {
      const input = this.GetComponent('PlayerInput');

      // Determine the forward and strafe velocities based on the player's input
      const forwardVelocity = (input.key(player_input.KEYS.w) ? 1 : 0) + (input.key(player_input.KEYS.s) ? -1 : 0);
      const strafeVelocity = (input.key(player_input.KEYS.a) ? 1 : 0) + (input.key(player_input.KEYS.d) ? -1 : 0);

      // Calculate the new translation based on the forward and strafe velocities
      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(qx);
      forward.multiplyScalar(forwardVelocity * timeElapsedS * this.walkSpeed_);
      const left = new THREE.Vector3(-1, 0, 0);
      left.applyQuaternion(qx);
      left.multiplyScalar(strafeVelocity * timeElapsedS * this.strafeSpeed_);
      const walk = forward.clone().add(left);

      this.Parent.Attributes.Physics.CharacterController.setWalkDirection(walk); // Set the walk direction for the character controller
      const t = this.Parent.Attributes.Physics.CharacterController.body_.getWorldTransform();
      const pos = t.getOrigin();
      const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());

      this.translation_.lerp(pos3, 0.75); // Smoothly interpolate the translation position

      // Handle jumping and power activation based on player input
      if (input.key(player_input.KEYS.SPACE)) {
        this.headBobActive_ = false;
        this.Parent.Attributes.Physics.CharacterController.jump();
      }

      if (input.key(player_input.KEYS.SHIFT_L)) {
        this.powerUp_(true);
      } else {
        this.powerUp_(false);
      }

      // Activate head bobbing if there is any movement
      if (forwardVelocity != 0 || strafeVelocity != 0) {
        this.headBobActive_ = true;
      }
    }

    // Handle power activation and deactivation
    powerUp_(activate) {
      if (this.power_ && activate) {
        return;
      }

      if (activate && this.powerTime_ < 1) {
        activate = false;
      }

      this.power_ = activate;
    }

    // Update the power status based on the time elapsed
    updatePower_(timeElapsedS) {
      if (this.power_) {
        this.powerTime_ -= timeElapsedS / POWER_TIME;
        if (this.powerTime_ < 0) {
          this.power_ = false;
        }
      } else {
        this.powerTime_ += timeElapsedS / POWER_RECHARGE;
        this.powerTime_ = math.sat(this.powerTime_);  
      }

      // Broadcast the power charge value to the UI
      this.FindEntity('ui').Broadcast(
          {topic: 'ui.charge', value: this.powerTime_});

      const power = this.power_;

      // Adjust the walk speed and jump multiplier based on the power status
      this.walkSpeed_ = power ? 30 : 10;
      this.Parent.Attributes.Physics.CharacterController.setJumpMultiplier(power ? 2.25 : 1);
    }
  
    // Update the camera rotation based on the player's mouse input
    updateRotation_(timeElapsedS) {
      const input = this.GetComponent('PlayerInput');

      const xh = input.current_.mouseXDelta / window.innerWidth;
      const yh = input.current_.mouseYDelta / window.innerHeight;
  
      this.phi_ += -xh * this.phiSpeed_;
      this.theta_ = math.clamp(this.theta_ + -yh * this.thetaSpeed_, -Math.PI / 3, Math.PI / 3);
  
      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
      const qz = new THREE.Quaternion();
      qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);
  
      const q = new THREE.Quaternion();
      q.multiply(qx);
      q.multiply(qz);
  
      const t = 1.0 - Math.pow(0.01, 5 * timeElapsedS);
      this.rotation_.slerp(q, t); // Smoothly interpolate the camera rotation
    }
  };

  // Return the FirstPersonCamera class
  return {
    FirstPersonCamera: FirstPersonCamera
  };

})();
