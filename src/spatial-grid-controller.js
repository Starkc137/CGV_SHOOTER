import {entity} from './entity.js';

// Define and export the spatial_grid_controller module
export const spatial_grid_controller = (() => {

  // Define the SpatialGridController class that extends the entity component
  class SpatialGridController extends entity.Component {
    constructor(params) {
      super();

      // Initialize with the provided grid
      this.grid_ = params.grid;
    }

    // Destroy the grid and remove the client
    Destroy() {
      this.grid_.Remove(this.client_);
      this.client_ = null;
    }

    // Initialize the entity
    InitEntity() {
      // Register the handler for the 'physics.loaded' event
      this.RegisterHandler_('physics.loaded', () => this.OnPhysicsLoaded_());

      // Set the initial position
      const pos = [
        this.Parent.Position.x,
        this.Parent.Position.z,
      ];

      // Create a new client with the provided position and size
      this.client_ = this.grid_.NewClient(pos, [1, 1]);
      this.client_.entity = this.parent_;
    }

    // Handle the 'physics.loaded' event
    OnPhysicsLoaded_() {
      this.RegisterHandler_('update.position', (m) => this.OnPosition_());
      this.OnPosition_();
    }

    // Handle changes in position
    OnPosition_() {
      const pos = this.Parent.Position;
      this.client_.position = [pos.x, pos.z];
      this.grid_.UpdateClient(this.client_);
    }

    // Find nearby entities within the given range
    FindNearbyEntities(range) {
      const results = this.grid_.FindNear(
          [this.parent_._position.x, this.parent_._position.z], [range, range]);
          
      return results.filter(c => c.entity != this.parent_);
    }
  };

  // Return the SpatialGridController class as an export
  return {
      SpatialGridController: SpatialGridController,
  };
})();
