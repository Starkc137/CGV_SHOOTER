// Import necessary components and modules
import {THREE} from './threeD.js';
import {entity} from './customEntity.js';

// Define and export the render_component module
export const render_component = (() => {

  // Define the RenderComponent class
  class RenderComponent extends entity.Component {
    constructor(params) {
      super();
      this.group_ = new THREE.Group();
      this.target_ = null;
      this.offset_ = null;
      this.params_ = params;
      this.params_.scene.add(this.group_);
    }

    // Method to clean up resources on component destruction
    Destroy() {
      this.group_.traverse(c => {
        if (c.material) {
          c.material.dispose();
        }
        if (c.geometry) {
          c.geometry.dispose();
        }
      });
      this.params_.scene.remove(this.group_);
    }

    // Method to initialize the entity
    InitEntity() {
      this.Parent.Attributes.Render = {
        group: this.group_,
      };

      this.LoadModels_();
    }
  
    // Method to initialize the component
    InitComponent() {
      // Register event handlers
      this.RegisterHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.RegisterHandler_('update.rotation', (m) => { this.OnRotation_(m); });
      this.RegisterHandler_('render.visible', (m) => { this.OnVisible_(m); });
      this.RegisterHandler_('render.offset', (m) => { this.OnOffset_(m.offset); });
    }

    // Method to handle visibility changes
    OnVisible_(m) {
      this.group_.visible = m.value;
    }

    // Method to handle position updates
    OnPosition_(m) {
      this.group_.position.copy(m.value);
    }

    // Method to handle rotation updates
    OnRotation_(m) {
      this.group_.quaternion.copy(m.value);
    }

    // Method to handle offset changes
    OnOffset_(offset) {
      this.offset_ = offset;
      if (!this.offset_) {
        return;
      }

      if (this.target_) {
        this.target_.position.copy(this.offset_.position);
        this.target_.quaternion.copy(this.offset_.quaternion);
      }
    }

    // Method to load 3D models
    LoadModels_() {
      const loader = this.FindEntity('loader').GetComponent('LoadController');
      loader.Load(
          this.params_.resourcePath, this.params_.resourceName, (mdl) => {
        this.OnLoaded_(mdl.scene);
      });
    }

    // Method to handle loaded models
    OnLoaded_(obj) {
      this.target_ = obj;
      this.group_.add(this.target_);
      this.group_.position.copy(this.Parent.Position);
      this.group_.quaternion.copy(this.Parent.Quaternion);

      this.target_.scale.copy(this.params_.scale);
      if (this.params_.offset) {
        this.offset_ = this.params_.offset;
      }
      this.OnOffset_(this.offset_);

      const textures = {};
      if (this.params_.textures) {
        const loader = this.FindEntity('loader').GetComponent('LoadController');

        for (let k in this.params_.textures.names) {
          const t = loader.LoadTexture(
              this.params_.textures.resourcePath, this.params_.textures.names[k]);
          t.encoding = THREE.sRGBEncoding;

          if (this.params_.textures.wrap) {
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
          }

          textures[k] = t;
        }
      }

      // Traverse through the target and apply necessary modifications
      this.target_.traverse(c => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        if (c.geometry) {
          c.geometry.computeBoundingBox();
        }

        for (let m of materials) {
          if (m) {
            if (this.params_.onMaterial) {
              this.params_.onMaterial(m);
            }
            for (let k in textures) {
              if (m.name.search(k) >= 0) {
                m.map = textures[k];
              }
            }
            if (this.params_.specular) {
              m.specular = this.params_.specular;
            }
            if (this.params_.emissive) {
              m.emissive = this.params_.emissive;
            }
            if (this.params_.colour) {
              m.color = this.params_.colour;
            }
          }
        }
        if (this.params_.receiveShadow !== undefined) {
          c.receiveShadow = this.params_.receiveShadow;
        }
        if (this.params_.castShadow !== undefined) {
          c.castShadow = this.params_.castShadow;
        }
        if (this.params_.visible !== undefined) {
          c.visible = this.params_.visible;
        }

        c.castShadow = true;
        c.receiveShadow = true;
      });

      // Broadcast that the rendering is complete
      this.Broadcast({
          topic: 'render.loaded',
          value: this.target_,
      });
    }

    // Method to update the component
    Update(timeInSeconds) {
    }
  };

  // Return the RenderComponent class
  return {
      RenderComponent: RenderComponent,
  };

})();
