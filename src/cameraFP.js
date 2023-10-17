import {THREE} from './threeD.js';
import {entity} from './customEntity.js';
import {math} from './math.js';
import {player_input} from './player-input.js';
import {passes} from './passes.js';


/**
 * @fileoverview This file contains the FirstPersonCamera class, which is responsible for managing the first-person camera in the game.
 * It updates the camera's position and rotation based on user input and physics, and also handles power-ups and head-bobbing_ effects.
 * @exports camerafp
 */
export const camerafp = (() => {

  const POWER_TIME = 5;
  const POWER_RECHARGE = 10;

  /**
   * FirstPersonCamera class that extends entity.Component.
   * @class
   * @memberof FirstPersonCamera
   * @extends entity.Component
   * @param {Object} params - The parameters object.
   * @param {THREE.PerspectiveCamera} params.camera - The camera object.
   * @param {THREE.Scene} params.scene - The scene object.
   */

  class FirstPersonCamera extends entity.Component {
    constructor(params) {
      super();

      this.params_ = params;
      this.camera_ = params.camera;
      this.group_ = new THREE.Group();
      this.params_.scene.add(this.group_);
    }

    /**
     * Removes the entity from the scene.
     */
    removeEntity() {
      this.params_.scene.remove(this.group_);
    }

    /**
     * Initializes the entity with default values for camera rotation, translation, phi, phi speed, theta, theta speed, head bobbing_, walk speed, strafe speed, power time, and power.
     */
    InitializeEntity() {
      this.rotation_ = new THREE.Quaternion();
      this.translation_ = new THREE.Vector3(0, 3, 0);
      this.phi_ = 0;
      this.phiSpeed_ = 8;
      this.theta_ = 0;
      this.thetaSpeed_ = 5;
      this.bobber_ = false;
      this.bobberTimer_ = 0;
      this.headBobSpeed_ = 15;
      this.headBobHeight_ = 0.01;
      this.walkSpeed_ = 10;
      this.strafeSpeed_ = 10;
      this.powerTime_ = 1;
      this.power_ = false;
      this.Parent.Attributes.FPSCamera = {
        group: this.group_
      };

      this.SetPass(passes.CAMERA);
    }

    /**
     * Updates the first-person camera's rotation, translation, bobbing, and power.
     * @param {number} timeElapsedS - The time elapsed in seconds since the last update.
     */
    Update(timeElapsedS) {
      this.updateRotation_(timeElapsedS);
      this.updateCamera_(timeElapsedS);
      this.updateTranslation_(timeElapsedS);
      this.bobbing_(timeElapsedS);
      this.updatePower_(timeElapsedS);

      this.Parent.SetPosition(this.translation_);
      this.Parent.SetQuaternion(this.rotation_);
    }

    /**
     * Updates the first-person camera position and orientation.
     * @param {any} _ Unused parameter.
     */
    updateCamera_(_) {
      this.camera_.quaternion.copy(this.rotation_);
      this.camera_.position.copy(this.translation_);
      this.camera_.position.y += Math.sin(this.bobberTimer_ * this.headBobSpeed_) * this.headBobHeight_;
      this.group_.position.copy(this.translation_);
      this.group_.quaternion.copy(this.rotation_);

      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.rotation_);

      forward.multiplyScalar(100);
      forward.add(this.translation_);

      const hits = this.FindEntity('physics').GetComponent('CustomAmmoJSController').RayTest(this.translation_, forward);

      if (hits.length > 0) {
        this.camera_.lookAt(hits[0].position);
      }
    }

    /**
     * Function that simulates camera bobbing effect in first-person shooter games.
     * @param {number} timeElapsedS - The time elapsed in seconds since the last call to this function.
     */
    bobbing_(timeElapsedS) {
      if (this.bobber_) {
        const wavelength = Math.PI;
        const nextStep = 1 + Math.floor(((this.bobberTimer_ + 0.000001) * this.headBobSpeed_) / wavelength);
        const nextStepTime = nextStep * wavelength / this.headBobSpeed_;
        this.bobberTimer_ = Math.min(this.bobberTimer_ + timeElapsedS, nextStepTime);

        if (this.bobberTimer_ == nextStepTime) {
          this.bobber_ = false;
          this.BroadcastEvent({
            topic: 'fps.step',
            step: nextStep,
          });
        }
      }
    }

    /**
     * Updates the translation of the camera based on player input.
     * @param {number} timeElapsedS - The time elapsed since the last update in seconds.
     */
    updateTranslation_(timeElapsedS) {
      const input = this.GetComponent('PlayerInput');

      const forwardVelocity = (input.key(player_input.KEYS.w) ? 1 : 0) + (input.key(player_input.KEYS.s) ? -1 : 0)
      const strafeVelocity = (input.key(player_input.KEYS.a) ? 1 : 0) + (input.key(player_input.KEYS.d) ? -1 : 0)

      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(qx);
      forward.multiplyScalar(forwardVelocity * timeElapsedS * this.walkSpeed_);

      const left = new THREE.Vector3(-1, 0, 0);
      left.applyQuaternion(qx);
      left.multiplyScalar(strafeVelocity * timeElapsedS * this.strafeSpeed_);
      const walk = forward.clone().add(left);
      this.Parent.Attributes.Physics.CharacterController.setWalkDirection(walk);
      const t = this.Parent.Attributes.Physics.CharacterController.body_.getWorldTransform();
      const pos = t.getOrigin();
      const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
      this.translation_.lerp(pos3, 0.75);

      if (input.key(player_input.KEYS.SPACE)) {
        this.bobber_ = false;
        this.Parent.Attributes.Physics.CharacterController.jump();
      }

      if (input.key(player_input.KEYS.SHIFT_L)) {
        this.powerUp_(true);
      } else {
        this.powerUp_(false);
      }

      if (forwardVelocity != 0 || strafeVelocity != 0) {
        this.bobber_ = true;
      }
    }

    /**
     * Activates or deactivates the power-up.
     * @param {boolean} activate - Whether to activate or deactivate the power-up.
     */
    powerUp_(activate) {
      if (this.power_ && activate) {
        return;
      }

      if (activate && this.powerTime_ < 1) {
        activate = false;
      }

      this.power_ = activate;
    }

    /**
     * Updates the power-up status.
     * @param {number} timeElapsedS - The time elapsed in seconds since the last update.
     */
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

      this.FindEntity('ui').BroadcastEvent(
          {topic: 'ui.charge', value: this.powerTime_})

      const power = this.power_;

      const threejs = this.FindEntity('threejs').GetComponent('CustomThreeJSController');

      threejs.radialBlur_.uniforms.strength.value = math.lerp(
          timeElapsedS * 5.0, threejs.radialBlur_.uniforms.strength.value, power ? 0.5 : 0);
      if (threejs.radialBlur_.uniforms.strength.value < 0.001 && !power) {
        threejs.radialBlur_.uniforms.strength.value = 0;
      }
      this.walkSpeed_ = power ? 30 : 10;
      this.Parent.Attributes.Physics.CharacterController.setJumpMultiplier(power ? 2.25 : 1);
    }
  
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
      this.rotation_.slerp(q, t);
    }
  };

  return {
    FirstPersonCamera: FirstPersonCamera
  };

})();