// Importing necessary modules and components
import {THREE, FBXLoader} from './threeD.js';
import {entity} from './customEntity.js';
import {finite_state_machine} from './finite-state-machine.js';
import {player_state} from './player-state.js';

// Creating the target_entity module
export const target_entity = (() => {
  
  // Creating private variables for internal use
  const _M = new THREE.Matrix4();
  const _R = new THREE.Quaternion();

  // Defining the TargetFSM class that extends the FiniteStateMachine class
  class TargetFSM extends finite_state_machine.FiniteStateMachine {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      this.Init_();
    }
  
    // Initializing the finite state machine
    Init_() {
      this._AddState('idle', player_state.IdleState);
      this._AddState('run', player_state.RunState);
      this._AddState('death', player_state.DeathState);
      this._AddState('shoot', player_state.AttackState);
    }
  };
  
  // Creating the TargetCharacterControllerProxy class
  class TargetCharacterControllerProxy {
    constructor(animations) {
      this.animations_ = animations;
    }
  
    get animations() {
      return this.animations_;
    }
  };

  // Defining the TargetCharacterController class that extends the entity.Component class
  class TargetCharacterController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    // Initializing the entity component
    InitEntity() {
      this.Init_();
    }

    // Initializing the target character controller
    Init_() {
      // Initializing various parameters and vectors
      this.decceleration_ = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this.acceleration_ = new THREE.Vector3(1, 0.125, 100.0);
      this.velocity_ = new THREE.Vector3(0, 0, 0);
      this.group_ = new THREE.Group();

      // Adding the group to the scene
      this.params_.scene.add(this.group_);
      this.animations_ = {};
  
      // Setting up render attributes and NPC flag
      this.Parent.Attributes.Render = {
        group: this.group_,
      };
      this.Parent.Attributes.NPC = true;
      
      // Loading 3D models
      this.LoadModels_();
    }

    // Initializing the entity component
    InitComponent() {
      this.RegisterHandler_('health.death', (m) => { this.OnDeath_(m); });
      this.RegisterHandler_(
          'update.position', (m) => { this.OnUpdatePosition_(m); });
      this.RegisterHandler_(
          'update.rotation', (m) => { this.OnUpdateRotation_(m); });
    }

    // Updating the position based on the message
    OnUpdatePosition_(msg) {
      this.group_.position.copy(msg.value);
    }

    // Updating the rotation based on the message
    OnUpdateRotation_(msg) {
      this.group_.quaternion.copy(msg.value);
    }

    // Handling the death event
    OnDeath_(msg) {
      this.stateMachine_.SetState('death');
    }

    // Loading 3D models
    LoadModels_() {
      const loader = this.FindEntity('loader').GetComponent('LoadController');
      loader.Load(this.params_.model.path, this.params_.model.name, (glb) => {
        this.target_ = glb.scene;

        // Adding the target to the group and setting the scale
        this.group_.add(this.target_);
        this.target_.scale.setScalar(this.params_.model.scale);

        // Setting up the position and rotation of the target
        this.target_.position.set(0, -2.35, 0);
        this.target_.rotateY(Math.PI);
  
        // Initializing bones and traverse through the target
        this.bones_ = {};
        this.target_.traverse(c => {
          if (!c.skeleton) {
            return;
          }
          for (let b of c.skeleton.bones) {
            this.bones_[b.name] = b;
          }
        });

        // Setting up shadow and material properties for the target
        this.target_.traverse(c => {
          c.castShadow = true;
          c.receiveShadow = true;
          if (c.material && c.material.map) {
            c.material.map.encoding = THREE.sRGBEncoding;
          }
        });

        // Initializing the animation mixer
        this.mixer_ = new THREE.AnimationMixer(this.target_);

        // Finding the animations for different states
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

        // Storing the animations for different states
        this.animations_['idle'] = _FindAnim('Idle');
        this.animations_['walk'] = _FindAnim('Walk');
        this.animations_['run'] = _FindAnim('Run');
        this.animations_['death'] = _FindAnim('Death');
        this.animations_['attack'] = _FindAnim('Shoot');
        this.animations_['shoot'] = _FindAnim('Shoot');

        // Setting the target visibility to true
        this.target_.visible = true;

        // Initializing the state machine and setting the state
        this.stateMachine_ = new TargetFSM(
            new TargetCharacterControllerProxy(this.animations_));

        if (this.queuedState_) {
          this.stateMachine_.SetState(this.queuedState_)
          this.queuedState_ = null;
        } else {
          this.stateMachine_.SetState('idle');
        }

        // Broadcasting the load character event
        this.Broadcast({
            topic: 'load.character',
            model: this.group_,
            bones: this.bones_,
        });
      });
    }

    // Finding the player's position
    FindPlayer_() {
      const player = this.FindEntity('player');

      const dir = player.Position.clone();
      dir.sub(this.Parent.Position);
      dir.y = 0;

      return dir;
    }

    // Updating the AI based on the elapsed time
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

    // Updating the target based on time
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
  
  // Exporting the necessary classes and components
  return {
      TargetFSM: TargetFSM,
      TargetCharacterController: TargetCharacterController,
  };

})();
