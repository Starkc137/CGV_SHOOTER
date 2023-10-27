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


/**
 * @namespace spawners
 */

export const spawners = (() => {

  /**
   * @classdesc Component for spawning the player entity
   * @memberof spawners
   * @extends entity.Component
   */
  class PlayerSpawner extends entity.Component {
    /**
     * @constructor
     * @param {Object} params - Parameters for the player spawner
     */
    constructor(params) {
      super();
      this.params_ = params;
    }

    /**
     * Spawns the player entity
     * @returns {entity.Entity} - The player entity
     */
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

  /**
   * @classdesc Component for spawning the level 1 entity
   * @memberof spawners
   * @extends entity.Component
   */
  class Level1Spawner extends entity.Component {
    /**
     * @constructor
     * @param {Object} params - Parameters for the level 1 spawner
     */
    constructor(params) {
      super();
      this.params_ = params;
    }

    /**
     * Spawns the level 1 entity
     * @returns {entity.Entity} - The level 1 entity
     */
    Spawn() {
      const e = new entity.Entity();
      e.SetPosition(new THREE.Vector3(0, 0, 0));
      e.AddComponent(new level_1_builder.Level1Builder(this.params_));

      this.Manager.Add(e, 'levelBuilder');

      return e;
    }
  };

  /**
   * @classdesc Component for spawning the target entity
   * @memberof spawners
   * @extends entity.Component
   */
  class TargetSpawner extends entity.Component {
    /**
     * @constructor
     * @param {Object} params - Parameters for the target spawner
     */
    constructor(params) {
      super();
      this.params_ = params;
    }

    /**
     * Spawns the target entity
     * @param {Object} params - Parameters for the target entity
     * @param {THREE.Vector3} params.position - The position of the target entity
     * @returns {entity.Entity} - The target entity
     */
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

  return {
    PlayerSpawner: PlayerSpawner,
    Level1Spawner: Level1Spawner,
    TargetSpawner: TargetSpawner,
  };
})();