// Import necessary components and libraries from other files
import {THREE} from './threeD.js';

import {entity} from './customEntity.js';
import {math} from './math.js';

// Define and export an AttackController class within an IIFE (Immediately Invoked Function Expression) to encapsulate the code
export const attack_controller = (() => {

  // Define the AttackController class that extends the entity Component
  class AttackController extends entity.Component {
    constructor(params) {
      super();
      // Initialize properties
      this.params_ = params;
      this.timeElapsed_ = 0.0;
      this.action_ = null;

      // Create a sound group using THREE.Group from the THREE library
      this.soundGroup_ = new THREE.Group();
      this.params_.scene.add(this.soundGroup_); // Add the sound group to the scene
    }

    // Method for initializing components
    InitializeComponent() {
      // Add an event handler for the 'player.action' event
      this.addEventHandler_('player.action', (m) => { this.OnAnimAction_(m); });
    }

    // Method for loading a sound
    LoadSound_(soundName) {
      // Find the CustomThreeJSController component from the entity 'threejs'
      const threejs = this.FindEntity('threejs').GetComponent('CustomThreeJSController');

      // Create a new PositionalAudio object using THREE.PositionalAudio
      const soundL = new THREE.PositionalAudio(threejs.listener_);

      // Add the sound to the sound group
      this.soundGroup_.add(soundL);

      // Use the AudioLoader from THREE to load the sound file
      const loader = new THREE.AudioLoader();
      loader.load('resources/sounds/' + soundName, (buffer) => {
        soundL.setBuffer(buffer);
        soundL.setLoop(false);
        soundL.setVolume(1.0);
        soundL.setRefDistance(1);
        soundL.play(); // Play the loaded sound
      });
    }

    // Method for handling animation actions
    OnAnimAction_(m) {
      // Check if the action has changed
      if (m.action != this.action_) {
        this.action_ = m.action;
        this.timeElapsed_ = 0.0;
      }

      const oldTiming = this.timeElapsed_;
      this.timeElapsed_ = m.time;

      // Check the timing and load a laser sound
      if (oldTiming < this.params_.timing && this.timeElapsed_ >= this.params_.timing) {
        this.LoadSound_('laser.ogg'); // Load the laser sound

        ////////////////////////////////////////////////////////////////////////////
        // Handle the creation of a tracer and check for hits on certain entities
        const physics = this.FindEntity('physics').GetComponent('CustomAmmoJSController');
        const end = this.Parent.Forward.clone();
        end.multiplyScalar(100.0); 
        end.add(this.Parent.Position);
        ////////////////////////////////////////////////////////////////////

        const target = this.FindEntity('player').Position.clone();

        // Add random offsets to the target position
        target.add(
            new THREE.Vector3(
                math.rand_range(-2.0, 2.0), math.rand_range(-2.0, 2.0), math.rand_range(-2.0, 2.0)));

        const offset = new THREE.Vector3(0.0, 0.1, -0.75);

        // Create a tracer using the BlasterSystem component
        const blaster = this.FindEntity('fx').GetComponent('BlasterSystem');
        const tracer = blaster.CreateParticle();
        tracer.Start = offset.clone();
        tracer.Start.applyQuaternion(this.Parent.Quaternion);
        tracer.Start.add(this.Parent.Position);
        tracer.End = target.clone().sub(this.Parent.Position).normalize();
        tracer.End.multiplyScalar(10.0);
        tracer.End.add(this.Parent.Position);

        tracer.Velocity = tracer.End.clone();
        tracer.Velocity.sub(tracer.Start);
        tracer.Velocity.normalize();
        tracer.Velocity.multiplyScalar(5.0);
        tracer.Colours = [new THREE.Color(0xFF0000), new THREE.Color(0xFFFFFF)];
        tracer.Length = 10.0;
        tracer.Life = 1.0;
        tracer.TotalLife = 1.0;
        tracer.Width = 0.125;

        // Check for hits on certain entities using RayTest
        const hits = physics.RayTest(this.Parent.Position, end);

        if (hits.length == 0) {
          return;
        }

        for (let i = 0; i < hits.length; ++i) {
          const mesh = this.FindEntity(hits[i].name);

          // Check if the hit entity is the player or an NPC
          if (mesh.Attributes.NPC) {
            if (mesh.Attributes.Stats.health > 0) {
              mesh.BroadcastEvent({topic: 'shot.hit', position: hits[i].position, start: this.Parent.Position, end: end});
              return;
            }
            continue;
          }

          return;
        }
      }
    }
  };

  // Export the AttackController class
  return {
      AttackController: AttackController,
  };
})();
