import {entity} from './entity.js';


export const spatial_grid_controller = (() => {

  class SpatialGridController extends entity.Component {
    constructor(params) {
      super();

      this.grid_ = params.grid;
    }

    removeEntity() {
      this.grid_.Remove(this.client_);
      this.client_ = null;
    }

    InitializeEntity() {
      this.addEventHandler_('physics.loaded', () => this.OnPhysicsLoaded_());

      const pos = [
        this.Parent.Position.x,
        this.Parent.Position.z,
      ];

      this.client_ = this.grid_.NewClient(pos, [1, 1]);
      this.client_.entity= this.entityParent_;
    }

    OnPhysicsLoaded_() {
      this.addEventHandler_('update.position', (m) => this.OnPosition_());
      this.OnPosition_();
    }

    OnPosition_() {
      const pos = this.Parent.Position;
      this.client_.position = [pos.x, pos.z];
      this.grid_.UpdateClient(this.client_);
    }

    FindNearbyEntities(range) {
      const results = this.grid_.FindNear(
          [this.entityParent_._position.x, this.entityParent_._position.z], [range, range]);
          
      return results.filter(c => c.entity!= this.entityParent_);
    }
  };

  return {
      SpatialGridController: SpatialGridController,
  };
})();