import {THREE, FBXLoader} from './threeD.js';

import {entity} from './customEntity.js';
import {finite_state_machine} from './finite-state-machine.js';
import {player_state} from './player-state.js';

export const target_entity = (() => {

const _M = new THREE.Matrix4();
const _R = new THREE.Quaternion();

/**
 * The finite state machine for the target character controller.
 * @extends finite_state_machine.FiniteStateMachine
 */
class TargetFSM extends finite_state_machine.FiniteStateMachine {
  /**
   * Creates an instance of TargetFSM.
   * @param {TargetCharacterControllerProxy} proxy - The target character controller proxy.
   */
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this.Init_();
  }

  /**
   * Initializes the finite state machine.
   * @private
   */
  Init_() {
    this._AddState('idle', player_state.IdleState);
    this._AddState('run', player_state.RunState);
    this._AddState('death', player_state.DeathState);
    this._AddState('shoot', player_state.AttackState);
  }
};

/**
 * The target character controller proxy.
 */
class TargetCharacterControllerProxy {
  /**
   * Creates an instance of TargetCharacterControllerProxy.
   * @param {Object} animations - The animations object.
   */
  constructor(animations) {
    this.animations_ = animations;
  }

  /**
   * Gets the animations object.
   * @returns {Object} The animations object.
   */
  get animations() {
    return this.animations_;
  }
};

/**
 * The target character controller component.
 * @extends entity.Component
 */
class TargetCharacterController extends entity.Component {
  /**
   * Creates an instance of TargetCharacterController.
   * @param {Object} params - The parameters object.
   */
  constructor(params) {
    super();
    this.params_ = params;
  }

  /**
   * Initializes the entity.
   */
  InitEntity() {
    this.Init_();
  }

  /**
   * Initializes the component.
   */
  Init_() {
    this.decceleration_ = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this.acceleration_ = new THREE.Vector3(1, 0.125, 100.0);
    this.velocity_ = new THREE.Vector3(0, 0, 0);
    this.group_ = new THREE.Group();

    this.params_.scene.add(this.group_);
    this.animations_ = {};

    this.Parent.Attributes.Render = {
      group: this.group_,
    };
    this.Parent.Attributes.NPC = true;
    this.LoadModels_();
  }

  InitComponent() {
    this.RegisterHandler_('health.death', (m) => { this.OnDeath_(m); });
    this.RegisterHandler_(
        'update.position', (m) => { this.OnUpdatePosition_(m); });
    this.RegisterHandler_(
        'update.rotation', (m) => { this.OnUpdateRotation_(m); });
  }

  /**
   * Handles the update position message.
   * @param {Object} msg - The message object.
   * @private
   */
  OnUpdatePosition_(msg) {
    this.group_.position.copy(msg.value);
  }

  /**
   * Handles the update rotation message.
   * @param {Object} msg - The message object.
   * @private
   */
  OnUpdateRotation_(msg) {
    this.group_.quaternion.copy(msg.value);
  }

  /**
   * Handles the death message.
   * @param {Object} msg - The message object.
   * @private
   */
  OnDeath_(msg) {
    this.stateMachine_.SetState('death');
  }

  /**
   * Loads the target model.
   * @private
   */
  LoadModels_() {
    const loader = this.FindEntity('loader').GetComponent('LoadController');
    loader.Load(this.params_.model.path, this.params_.model.name, (glb) => {
      this.target_ = glb.scene;

      this.group_.add(this.target_);
      this.target_.scale.setScalar(this.params_.model.scale);
      this.target_.position.set(0, -2.35, 0);
      this.target_.rotateY(Math.PI);

      this.bones_ = {};
      this.target_.traverse(c => {
        if (!c.skeleton) {
          return;
        }
        for (let b of c.skeleton.bones) {
          this.bones_[b.name] = b;
        }
      });

      this.target_.traverse(c => {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material && c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding;
        }
      });

      this.mixer_ = new THREE.AnimationMixer(this.target_);

      const _FindAnim = (animName) => {
        for (let i = 0; i < glb.animations.length; i++) {
          if (glb.animations[i].name.includes(animName)) {
            const clip = glb.animations[i];
            const action = this.mixer_.clipAction(clip);
            return {
              clip: clip,
              action: action
            }
          }
        }
        return null;
      };

      this.animations_['idle'] = _FindAnim('Idle');
      this.animations_['walk'] = _FindAnim('Walk');
      this.animations_['run'] = _FindAnim('Run');
      this.animations_['death'] = _FindAnim('Death');
      this.animations_['attack'] = _FindAnim('Shoot');
      this.animations_['shoot'] = _FindAnim('Shoot');

      this.target_.visible = true;

      this.stateMachine_ = new TargetFSM(
          new TargetCharacterControllerProxy(this.animations_));

      if (this.queuedState_) {
        this.stateMachine_.SetState(this.queuedState_)
        this.queuedState_ = null;
      } else {
        this.stateMachine_.SetState('idle');
      }

      this.Broadcast({
          topic: 'load.character',
          model: this.group_,
          bones: this.bones_,
      });
    });
  }

  /**
   * Finds the player entity.
   * @returns {THREE.Vector3} The player entity.
   * @private
   */
  FindPlayer_() {
    const player = this.FindEntity('player');

    const dir = player.Position.clone();
    dir.sub(this.Parent.Position);
    dir.y = 0;

    return dir;
  }

  /**
   * Updates the AI.
   * @param {number} timeElapsedS - The elapsed time in seconds.
   * @private
   */
  _UpdateAI(timeElapsedS) {
    const toPlayer = this.FindPlayer_();
    const dirToPlayer = toPlayer.clone().normalize();

    if (toPlayer.length() == 0 || toPlayer.length() > 50) {
      this.stateMachine_.SetState('idle');
      this.Parent.Attributes.Physics.CharacterController.setWalkDirection(new THREE.Vector3(0, 0, 0));
      return;
    }

    _M.lookAt(
        new THREE.Vector3(0, 0, 0),
        dirToPlayer,
        new THREE.Vector3(0, 1, 0));
    _R.setFromRotationMatrix(_M);

    this.Parent.SetQuaternion(_R);

    if (toPlayer.length() < 20) {
      this.stateMachine_.SetState('shoot');
      this.Parent.Attributes.Physics.CharacterController.setWalkDirection(new THREE.Vector3(0, 0, 0));
      return;
    }

    const forwardVelocity = 5;
    const strafeVelocity = 0;

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(_R);
    forward.multiplyScalar(forwardVelocity * timeElapsedS * 2);

    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(_R);
    left.multiplyScalar(strafeVelocity * timeElapsedS * 2);

    const walk = forward.clone().add(left);
  
      this.Parent.Attributes.Physics.CharacterController.setWalkDirection(walk);
      this.stateMachine_.SetState('run');
    }

    Update(timeInSeconds) {
      if (!this.stateMachine_) {
        return;
      }

      const input = this.GetComponent('BasicCharacterControllerInput');
      this.stateMachine_.Update(timeInSeconds, input);



      if (this.stateMachine_._currentState._action) {
        this.Broadcast({
          topic: 'player.action',
          action: this.stateMachine_._currentState.Name,
          time: this.stateMachine_._currentState._action.time,
        });
      }
      
      if (this.mixer_) {
        this.mixer_.update(timeInSeconds);
      }


      switch (this.stateMachine_.State) {
        case 'idle': {
          this._UpdateAI(timeInSeconds);
          break;
        }
        case 'run': {
          this._UpdateAI(timeInSeconds);
          break;
        }
        case 'shoot': {
          break;
        }
        case 'death': {
          this.Parent.Attributes.Physics.CharacterController.setWalkDirection(new THREE.Vector3(0, 0, 0));
          break;
        }
      }

      const t = this.Parent.Attributes.Physics.CharacterController.body_.getWorldTransform();
      const pos = t.getOrigin();
      const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());

      this.Parent.SetPosition(pos3);

    }
  };
  
  return {
      TargetFSM: TargetFSM,
      TargetCharacterController: TargetCharacterController,
  };

})();