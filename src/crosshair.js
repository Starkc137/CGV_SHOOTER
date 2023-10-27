// Import necessary components and libraries from other files
import {THREE} from './threeD.js';
import {entity} from './customEntity.js';

// Define and export a crosshair module within an IIFE (Immediately Invoked Function Expression) to encapsulate the code
export const crosshair = (() => {

  // Define the Crosshair class that extends the entity Component
  class Crosshair extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.visible_ = true;
    }

    // Method to destroy the crosshair
    Destroy() {
      // Dispose of materials and geometry if they exist, and remove the crosshair from its parent
      if (!this.sprite_) {
        this.visible_ = false;
        return;
      }

      this.sprite_.traverse(c => {
        if (c.material) {
          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
          for (let m of materials) {
            m.dispose();
          }
        }

        if (c.geometry) {
          c.geometry.dispose();
        }
      });
      if (this.sprite_.parent) {
        this.sprite_.parent.remove(this.sprite_);
      }
    }

    // Method to initialize the entity
    InitEntity() {
      // Call the method to create the sprite
      this.OnCreateSprite_();
    }

    // Method to handle destruction events
    OnDeath_() {
      this.Destroy();
    }

    // Method to create the sprite
    OnCreateSprite_() {
      // Return if the crosshair is not visible
      if (!this.visible_) {
        return;
      }

      const size = 128;
      this.element_ = document.createElement('canvas');
      this.context2d_ = this.element_.getContext('2d');
      this.context2d_.canvas.width = size;
      this.context2d_.canvas.height = size;

      this.context2d_.fillStyle = "#FFFFFF";
      this.context2d_.lineWidth = 5;

      this.context2d_.translate(size * 0.5, size * 0.5);
      this.context2d_.rotate(Math.PI / 4);
      this.context2d_.translate(-size * 0.5, -size * 0.5);

      const _DrawLine = () => {
        // Draw lines for the crosshair
        this.context2d_.translate(size * 0.5, size * 0.5);
        this.context2d_.rotate(Math.PI / 2);
        this.context2d_.translate(-size * 0.5, -size * 0.5);
        this.context2d_.beginPath();
        this.context2d_.moveTo(size * 0.48, size * 0.25);
        this.context2d_.moveTo(size * 0.495, size * 0.45);
        this.context2d_.lineTo(size * 0.505, size * 0.45);
        this.context2d_.lineTo(size * 0.52, size * 0.25);
        this.context2d_.lineTo(size * 0.48, size * 0.25);
        this.context2d_.fill();
      }

      // Draw lines for the crosshair
      for (let i = 0; i < 4; ++i) {
        _DrawLine();
      }

      // Create a CanvasTexture from the drawn canvas
      const map = new THREE.CanvasTexture(this.context2d_.canvas);
      map.anisotropy = 2;

      // Create a sprite using the CanvasTexture and add it to the scene
      this.sprite_ = new THREE.Sprite(
          new THREE.SpriteMaterial({map: map, color: 0xffffff, fog: false, depthTest: false}));
      this.sprite_.scale.set(4, 4, 1)
      this.sprite_.position.set(0, 5, 0);

      // Add the sprite to the UI scene
      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
      threejs.uiScene_.add(this.sprite_);
    }

    // Method to update the crosshair
    Update() {
      // Return if the sprite doesn't exist
      if (!this.sprite_) {
        return;
      }
      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
      const camera = threejs.camera_;

      // Define a vector in NDC space
      const ndc = new THREE.Vector3(0, 0, -10);

      // Set the scale and position of the sprite based on the camera and NDC vector
      this.sprite_.scale.set(0.15, 0.15 * camera.aspect, 1);
      this.sprite_.position.copy(ndc);

      // Perform raycasting to check for collisions
      const physics = this.FindEntity('physics').GetComponent('AmmoJSController');
      const forward = this.Parent.Forward.clone();
      forward.multiplyScalar(1000);
      forward.add(this.Parent.Position);

      const hits = physics.RayTest(this.Parent.Position, forward).filter(
          (h) => {
            return h.name != this.Parent.Name;
          }
      );

      // Change the color of the crosshair based on the presence of hits
      if (hits.length > 0) {
        this.sprite_.material.color.setRGB(1, 0, 0); // Change to red if there are hits
      } else {
        this.sprite_.material.color.setRGB(1, 1, 1); // Change to white if there are no hits
      }
    }
  };

  // Export the Crosshair class
  return {
    Crosshair: Crosshair,
  };
})();
