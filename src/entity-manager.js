

/**
 * A module that provides an EntityManager class for managing game entities.
 * @module entity_manager
 */

export const entity_manager = (() => {

  /**
   * Class representing an EntityManager.
   * @memberof module:entity_manager
   */
  class EntityManager {
    constructor() {
      /**
       * The current number of entities.
       * @type {number}
       * @private
       */
      this.ids_ = 0;

      /**
       * A map of entity names to entities.
       * @type {Object.<string, Entity>}
       * @private
       */
      this.entitiesMap_ = {};

      /**
       * An array of entities.
       * @type {Array.<Entity>}
       * @private
       */
      this.entities_ = [];

      /**
       * An array of update passes.
       * @type {Array.<number>}
       * @private
       */
      this.passes_ = [0, 1, 2, 3];
    }

    /**
     * Pause all components in the game.
     */
    pauseAll() {
      this.entitieslist_.forEach(entity => {
        entity.entityComponents.forEach(component => {
          if (component.paused !== undefined) {
            component.pause();
          }
        });
      });
    }

    /**
     * Resume game functionalities.
     */
    resumeAll() {
      this.entitieslist_.forEach(entity => {
        entity.entityComponents.forEach(component => {
          if (component.paused !== undefined) {
            component.resume();
          }
        });
      });
    }

    /**
     * Generates a unique name for an entity.
     * @return {string} A unique name for an entity.
     * @private
     */
    _GenerateName() {
      return '__name__' + this.ids_;
    }

    /**
     * Gets an entity by name.
     * @param {string} n - The name of the entity to get.
     * @return {Entity} The entity with the given name.
     */
    Get(n) {
      return this.entitiesMap_[n];
    }

    /**
     * Filters entities based on a callback function.
     * @param {function} cb - The callback function to filter entities.
     * @return {Array.<Entity>} An array of entities that pass the filter.
     */
    Filter(cb) {
      return this.entities_.filter(cb);
    }

    /**
     * Adds an entity to the manager.
     * @param {Entity} e - The entity to add.
     * @param {string} [n] - The name of the entity. If not provided, a unique name will be generated.
     */
    Add(e, n) {
      this.ids_ += 1;

      if (!n) {
        n = this._GenerateName();
      }

      this.entitiesMap_[n] = e;
      this.entities_.push(e);

      e.SetParent(this);
      e.SetName(n);
      e.SetId(this.ids_);
      e.InitEntity();
    }

    /**
     * Sets an entity as active or inactive.
     * @param {Entity} e - The entity to set.
     * @param {boolean} b - Whether to set the entity as active or inactive.
     */
    SetActive(e, b) {
      const i = this.entities_.indexOf(e);

      if (!b) {
        if (i < 0) {
          return;
        }
  
        this.entities_.splice(i, 1);
      } else {
        if (i >= 0) {
          return;
        }

        this.entities_.push(e);
      }
    }

    /**
     * Updates all entities in the manager.
     * @param {number} timeElapsed - The time elapsed since the last update.
     */
    Update(timeElapsed) {
      for (let i = 0; i < this.passes_.length; ++i) {
        this.UpdateEntitiesInPass_(timeElapsed, this.passes_[i]);
      }
    }

    /**
     * Updates all entities in a given pass.
     * @param {number} timeElapsedS - The time elapsed since the last update.
     * @param {number} pass - The update pass to update entities in.
     * @private
     */
    UpdateEntitiesInPass_(timeElapsedS, pass) {
      const dead = [];
      const alive = [];
      for (let i = 0; i < this.entities_.length; ++i) {
        const e = this.entities_[i];

        e.Update(timeElapsedS, pass);

        if (e.dead_) {
          dead.push(e);
        } else {
          alive.push(e);
        }
      }

      for (let i = 0; i < dead.length; ++i) {
        const e = dead[i];

        delete this.entitiesMap_[e.Name];
  
        e.Destroy();
      }

      this.entities_ = alive;
    }
  }

  return {
    EntityManager: EntityManager
  };

})();