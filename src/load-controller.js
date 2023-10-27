// Import necessary modules and libraries
import { THREE, FBXLoader, GLTFLoader, SkeletonUtils } from './threeD.js';
import { entity } from "./customEntity.js";

// Create and export the load_controller module
export const load_controller = (() => {

  // Define the LoadController class that extends the entity.Component class
  class LoadController extends entity.Component {
    // Constructor for LoadController
    constructor() {
      super();

      // Initialize object properties for textures, models, sounds, and playing sounds
      this.textures_ = {}; // To store loaded textures
      this.models_ = {}; // To store loaded 3D models
      this.sounds_ = {}; // To store loaded sounds
      this.playing_ = []; // To keep track of currently playing sounds
    }

    // Method to add a 3D model to the game
    AddModel(model, path, name) {
      const fullName = path + name;
      this.models_[fullName] = { loader: null, asset: model }
    }

    // Method to load a texture
    LoadTexture(path, name) {
      if (!(name in this.textures_)) {
        const loader = new THREE.TextureLoader();
        loader.setPath(path);

        this.textures_[name] = { loader: loader, texture: loader.load(name) };
        this.textures_[name].encoding = THREE.sRGBEncoding;
      }

      return this.textures_[name].texture;
    }

    // Method to load a sound
    LoadSound(path, name, onLoad) {
      if (!(name in this.sounds_)) {
        const loader = new THREE.AudioLoader();
        loader.setPath(path);

        // Load the sound and add it to the list of currently playing sounds
        loader.load(name, (buf) => {
          this.sounds_[name] = {
            buffer: buf
          };
          const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
          const s = new THREE.PositionalAudio(threejs.listener_);
          s.setBuffer(buf);
          s.setRefDistance(10);
          s.setMaxDistance(500);
          onLoad(s);
          this.playing_.push(s);
        });
      } else {
        const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
        const s = new THREE.PositionalAudio(threejs.listener_);
        s.setBuffer(this.sounds_[name].buffer);
        s.setRefDistance(25);
        s.setMaxDistance(1000);
        onLoad(s);
        this.playing_.push(s);
      }
    }

    // Method to load an asset based on its file type
    Load(path, name, onLoad) {
      if (name.endsWith('glb') || name.endsWith('gltf')) {
        this.LoadGLB(path, name, onLoad);
      } else if (name.endsWith('fbx')) {
        this.LoadFBX(path, name, onLoad);
      } else {
        const fullName = path + name;
        if (this.models_[fullName]) {
          const clone = this.models_[fullName].asset.clone();
          onLoad({ scene: clone });
          return;
        }
      }
    }

    // Method to load an FBX model
    LoadFBX(path, name, onLoad) {
      if (!(name in this.models_)) {
        const loader = new FBXLoader();
        loader.setPath(path);

        // Load the FBX model and clone it when loading is complete
        this.models_[name] = { loader: loader, asset: null, queue: [onLoad] };
        this.models_[name].loader.load(name, (fbx) => {
          this.models_[name].asset = fbx;

          const queue = this.models_[name].queue;
          this.models_[name].queue = null;
          for (let q of queue) {
            const clone = SkeletonUtils.clone(this.models_[name].asset);
            q(clone);
          }
        });
      } else if (this.models_[name].asset == null) {
        this.models_[name].queue.push(onLoad);
      } else {
        const clone = SkeletonUtils.clone(this.models_[name].asset);
        onLoad(clone);
      }
    }

    // Method to load a GLB model
    LoadGLB(path, name, onLoad) {
      const fullName = path + name;
      if (!(fullName in this.models_)) {
        const loader = new GLTFLoader();
        loader.setPath(path);

        // Load the GLB model and clone it when loading is complete
        this.models_[fullName] = { loader: loader, asset: null, queue: [onLoad] };
        this.models_[fullName].loader.load(name, (glb) => {
          this.models_[fullName].asset = glb;

          const queue = this.models_[fullName].queue;
          this.models_[fullName].queue = null;
          for (let q of queue) {
            const clone = { ...glb };
            clone.scene = SkeletonUtils.clone(clone.scene);

            q(clone);
          }
        });
      } else if (this.models_[fullName].asset == null) {
        this.models_[fullName].queue.push(onLoad);
      } else {
        const clone = { ...this.models_[fullName].asset };
        clone.scene = SkeletonUtils.clone(clone.scene);

        onLoad(clone);
      }
    }

    // Method to update the loaded assets
    Update(timeElapsed) {
      // Update the loaded assets, such as playing sounds
      for (let i = 0; i < this.playing_.length; ++i) {
        if (!this.playing_[i].isPlaying) {
          this.playing_[i].parent.remove(this.playing_[i]);
        }
      }
      this.playing_ = this.playing_.filter(s => s.isPlaying);
    }
  }

  // Return the LoadController class for external use
  return {
    LoadController: LoadController,
  };
})();
