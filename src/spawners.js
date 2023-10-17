import {THREE} from './threeD.js';

import {entity} from './customEntity.js';

import {player_controller} from './player-controller.js';
import {player_input} from './player-input.js';
import {camerafp} from './cameraFP.js';
import {aim} from './targetAim.js';
import {kinematic_character_controller} from './kinematic-character-controller.js';
import {gun_controller} from './gun-controller.js';
import {level_1_builder} from './level-1-builder.js';
import {health_component} from './health-component.js';
import {render_component} from './render-component.js';
import {basic_rigid_body} from './rigidBodyPhysics.js';
import {target_entity} from './target-controller.js';
import {attack_controller} from './attack-controller.js';


export const spawners = (() => {

  class PlayerSpawner extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    Spawn() {
      const player = new entity.CustomEntity();
      player.SetPosition(new THREE.Vector3(0, 2, 0));
      player.addEntityComponent(new player_input.PlayerInput(this.params_));
      player.addEntityComponent(new camerafp.FirstPersonCamera(this.params_));
      player.addEntityComponent(new aim.Aim(this.params_));
      player.addEntityComponent(new kinematic_character_controller.KinematicCharacterController(this.params_));
      player.addEntityComponent(new gun_controller.GunController(this.params_));
      player.addEntityComponent(new health_component.HealthComponent({health: 100, maxHealth: 100, updateUI: true}));

      this.Manager.Add(player, 'player');

      return player;
    }
  };

  class Level1Spawner extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    Spawn() {
      const e = new entity.CustomEntity();
      e.SetPosition(new THREE.Vector3(0, 0, 0));
      e.addEntityComponent(new level_1_builder.Level1Builder(this.params_));

      this.Manager.Add(e, 'levelBuilder');

      return e;
    }
  };

  class TargetSpawner extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    Spawn(params) {
      const e = new entity.CustomEntity();
      e.addEntityComponent(new target_entity.TargetCharacterController({
        scene: this.params_.scene,
        model: {
          path: './resources/daSource/Characters/glTF/',
          name: 'Character_Enemy.gltf',
          scale: 1.5,
        },
      }));
      e.addEntityComponent(new kinematic_character_controller.KinematicCharacterController(this.params_));
      e.addEntityComponent(new attack_controller.AttackController({scene: this.params_.scene, timing: 0.2}));
      e.addEntityComponent(new health_component.HealthComponent({health: 100, maxHealth: 100}));

      this.Manager.Add(e, 'target');
      e.SetPosition(params.position);
      e.setActiveStatus(true);

      return e;
    }
  };

  return {
    PlayerSpawner: PlayerSpawner,
    Level1Spawner: Level1Spawner,
    TargetSpawner: TargetSpawner,
  };
})();