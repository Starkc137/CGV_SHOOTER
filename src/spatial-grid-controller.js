import {entity} from './entity.js';


/**
 * A controller for managing entities in a spatial grid.
 * @namespace
 */
export const spatial_grid_controller = (() => {

  /**
   * @class
   * @classdesc A controller for managing entities in a spatial grid.
   * @memberof spatial_grid_controller
   * @extends entity.Component
   */
  class SpatialGridController extends entity.Component {
    /**
     * Creates an instance of SpatialGridController.
     * @param {Object} params - The parameters for the controller.
     * @param {SpatialGrid} params.grid - The spatial grid to use.
     */
    constructor(params) {
      super();

      this.grid_ = params.grid;
    }

    /**
     * Destroys the controller.
     */
    Destroy() {
      this.grid_.Remove(this.client_);
      this.client_ = null;
    }

    /**
     * Initializes the entity.
     */
    InitEntity() {
      this.RegisterHandler_('physics.loaded', () => this.OnPhysicsLoaded_());

      const pos = [
        this.Parent.Position.x,
        this.Parent.Position.z,
      ];

      this.client_ = this.grid_.NewClient(pos, [1, 1]);
      this.client_.entity = this.parent_;
    }

    /**
     * Handles the physics loaded event.
     * @private
     */
    OnPhysicsLoaded_() {
      this.RegisterHandler_('update.position', (m) => this.OnPosition_());
      this.OnPosition_();
    }

    /**
     * Handles the position update event.
     * @private
     */
    OnPosition_() {
      const pos = this.Parent.Position;
      this.client_.position = [pos.x, pos.z];
      this.grid_.UpdateClient(this.client_);
    }

    /**
     * Finds nearby entities within a given range.
     * @param {number} range - The range to search for entities.
     * @returns {Array} - An array of nearby entities.
     */
    FindNearbyEntities(range) {
      const results = this.grid_.FindNear(
          [this.parent_._position.x, this.parent_._position.z], [range, range]);
          
      return results.filter(c => c.entity != this.parent_);
    }
  };

  return {
      SpatialGridController: SpatialGridController,
  };
})();