/**
 * A custom entity manager class that manages entities in a game.
 * @class
 */
export const entity_manager = (() => {

  class CustomEntityManager {
    constructor() {
      this.entityids_ = 0;
      this.entitiesMap_ = {};
      this.entitieslist_ = [];
      this.updatepasses_ = [0, 1, 2, 3];
    }

    /**
     * Generates a unique name for an entity.
     * @private
     * @returns {string} A unique name for an entity.
     */
    _GenerateEntityName() {
      return '__name__' + this.entityids_;
    }

    /**
     * Gets an entity by its name.
     * @param {string} name - The name of the entity to get.
     * @returns {Object} The entity with the given name.
     */
    Get(name) {
      return this.entitiesMap_[name];
    }

    /**
     * Filters the list of entities based on a callback function.
     * @param {function} cb - The callback function to use for filtering.
     * @returns {Array} The filtered list of entities.
     */
    Filter(cb) {
      return this.entitieslist_.filter(cb);
    }

    /**
     * Adds an entity to the manager.
     * @param {Object} e - The entity to add.
     * @param {string} [name] - The name to give the entity. If not provided, a unique name will be generated.
     */
    Add(e, name) {
      this.entityids_ += 1;

      if (!name) {
        name = this._GenerateEntityName();
      }

      this.entitiesMap_[name] = e;
      this.entitieslist_.push(e);

      e.setParentEntity(this);
      e.SetName(name);
      e.setEntityId(this.entityids_);
      e.InitializeEntity();
    }

    /**
     * Sets the active status of an entity.
     * @param {Object} e - The entity to set the active status for.
     * @param {boolean} b - The active status to set.
     */
    setActiveStatus(e, b) {
      const i = this.entitieslist_.indexOf(e);

      if (!b) {
        if (i < 0) {
          return;
        }
  
        this.entitieslist_.splice(i, 1);
      } else {
        if (i >= 0) {
          return;
        }

        this.entitieslist_.push(e);
      }
    }

    /**
     * Updates all entities in the manager.
     * @param {number} timeElapsed - The time elapsed since the last update.
     */
    Update(timeElapsed) {
      for (let i = 0; i < this.updatepasses_.length; ++i) {
        this.UpdateEntitiesInPass_(timeElapsed, this.updatepasses_[i]);
      }
    }

    /**
     * Updates all entities in a specific pass.
     * @private
     * @param {number} timeElapsedS - The time elapsed since the last update.
     * @param {number} pass - The pass to update entities in.
     */
    UpdateEntitiesInPass_(timeElapsedS, pass) {
      const deadentities = [];
      const aliveEntities = [];
      for (let i = 0; i < this.entitieslist_.length; ++i) {
        const e = this.entitieslist_[i];

        e.Update(timeElapsedS, pass);

        if (e.dead_) {
          deadentities.push(e);
        } else {
          aliveEntities.push(e);
        }
      }

      for (let i = 0; i < deadentities.length; ++i) {
        const e = deadentities[i];

        delete this.entitiesMap_[e.Name];
  
        e.removeEntity();
      }

      this.entitieslist_ = aliveEntities;
    }
  }

  return {
    CustomEntityManager: CustomEntityManager
  };

})();