// Importing necessary dependencies and components
import {THREE} from './threeD.js';
import {entity} from './customEntity.js';
import {player_input} from './player-input.js';
import {first_person_camera} from './first-person-camera.js';
import {crosshair} from './crosshair.js';
import {kinematic_character_controller} from './kinematic-character-controller.js';
import {gun_controller} from './gun-controller.js';
import {level_1_builder} from './level-1-builder.js';
import {health_component} from './health-component.js';
import {target_entity} from './target-controller.js';

// Defining the spawners module, responsible for spawning various entities in the game
export const spawners = (() => {

  // Class responsible for spawning the player entity
  class PlayerSpawner extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    // Function to spawn the player entity with required components
    Spawn() {
      const player = new entity.Entity();
      player.SetPosition(new THREE.Vector3(0, 2, 0));
      player.AddComponent(new player_input.PlayerInput(this.params_));
      player.AddComponent(new first_person_camera.FirstPersonCamera(this.params_));
      player.AddComponent(new crosshair.Crosshair(this.params_));
      player.AddComponent(new kinematic_character_controller.KinematicCharacterController(this.params_));
      player.AddComponent(new gun_controller.GunController(this.params_));
      player.AddComponent(new health_component.HealthComponent({health: 100, maxHealth: 100, updateUI: true}));

      this.Manager.Add(player, 'player');

      return player;
    }
  };

  // Class responsible for spawning entities related to level 1 building
  class Level1Spawner extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    // Function to spawn entities related to level 1 building
    Spawn() {
      const e = new entity.Entity();
      e.SetPosition(new THREE.Vector3(0, 0, 0));
      e.AddComponent(new level_1_builder.Level1Builder(this.params_));

      this.Manager.Add(e, 'levelBuilder');

      return e;
    }
  };

  // Class responsible for spawning target entities
  class TargetSpawner extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    // Function to spawn a target entity with required components
    Spawn(params) {
      const e = new entity.Entity();
      e.AddComponent(new target_entity.TargetCharacterController({
        scene: this.params_.scene,
        model: {
          path: './resources/quaternius/Enemies/',
          name: 'Character_Enemy.gltf',
          scale: 1.5,
        },
      }));
      e.AddComponent(new kinematic_character_controller.KinematicCharacterController(this.params_));
      e.AddComponent(new health_component.HealthComponent({health: 100, maxHealth: 100}));

      this.Manager.Add(e,'target');
      e.SetPosition(params.position);
      e.SetActive(true);

      return e;
    }
  };

  // Exposing the relevant classes as part of the spawners module
  return {
    PlayerSpawner: PlayerSpawner,
    Level1Spawner: Level1Spawner,
    TargetSpawner: TargetSpawner,
  };
})();
