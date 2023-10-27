

export const entity_manager = (() => {

  class EntityManager {
    constructor() {
      this.ids_ = 0;
      this.entitiesMap_ = {};
      this.entities_ = [];
      this.passes_ = [0, 1, 2, 3];
    }
        /**
     * Pause All Components In Game
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
    
        /**Resume Game Functionalities */
        resumeAll() {
          this.entitieslist_.forEach(entity => {
            entity.entityComponents.forEach(component => {
              if (component.paused !== undefined) {
                component.resume();
              }
            });
          });
        }

    _GenerateName() {
      return '__name__' + this.ids_;
    }

    Get(n) {
      return this.entitiesMap_[n];
    }

    Filter(cb) {
      return this.entities_.filter(cb);
    }

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

    Update(timeElapsed) {
      for (let i = 0; i < this.passes_.length; ++i) {
        this.UpdateEntitiesInPass_(timeElapsed, this.passes_[i]);
      }
    }

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