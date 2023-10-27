import {THREE, DecalGeometry} from './threeD.js';
import {entity} from './customEntity.js';
import {render_component} from './render-component.js';
import {passes} from './passes.js';
import {render_order} from './render-order.js';
import {math} from './math.js';

export const gun_controller = (() => {

  const DEFAULT_COOLDOWN = 0.5; // Default cooldown time between shots

  // Exponential impulse function to simulate gun recoil
  function ExpImpulse(x, k) {
    const h = k * x;
    return h * Math.exp(1.0 - h);
  }

  class GunController extends entity.Component {
    constructor(params) {
      super();

      // Initialize various components and groups for managing gun-related elements
      this.group_ = new THREE.Group(); // Group for gun mesh
      this.soundGroup_ = new THREE.Group(); // Group for positional audio
      this.decals_ = new THREE.Group(); // Group for bullet impact decals
      this.decals_.renderOrder = render_order.DECALS; // Set render order for decals
      this.params_ = params;
      this.params_.scene.add(this.decals_); // Add the decals group to the scene
      this.params_.scene.add(this.soundGroup_); // Add the sound group to the scene
      this.lastStep_ = 0.0;
      this.cooldown_ = 0.0;
    }

    Destroy() {
      // Dispose of materials and geometries in the gun group upon destruction
      this.group_.traverse(c => {
        if (c.material) {
          c.material.dispose();
        }
        if (c.geometry) {
          c.geometry.dispose();
        }
      });
      this.group_.parent.remove(this.group_); // Remove the gun group from the parent
    }

    InitComponent() {
      // Register event handlers for visibility and footsteps
      this.RegisterHandler_('render.visible', (m) => { this.OnVisible_(m); });
      this.RegisterHandler_('fps.step', (m) => { this.OnStep_(m); });
      this.SetPass(passes.GUN); // Set the rendering pass for the gun
    }

    LoadSound_(soundName) {
      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');

      // Create a positional audio element for gun sounds
      const soundL = new THREE.PositionalAudio(threejs.listener_);

      this.soundGroup_.add(soundL);

      const loader = new THREE.AudioLoader();
      loader.load('resources/sounds/' + soundName, (buffer) => {
        soundL.setBuffer(buffer);
        soundL.setLoop(false);
        soundL.setVolume(1.0);
        soundL.setRefDistance(1);
        soundL.play();
      });
    }

    InitEntity() {
      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
      const textureLoader = new THREE.TextureLoader();
      const whitesquare = textureLoader.load('./resources/textures/whitesquare.png');
      whitesquare.anisotropy = threejs.getMaxAnisotropy();
      whitesquare.wrapS = THREE.RepeatWrapping;
      whitesquare.wrapT = THREE.RepeatWrapping;

      const decalMaterial = new THREE.MeshStandardMaterial({ map: whitesquare });
      const geo = new THREE.BoxGeometry(1, 1, 1);

      let box = new THREE.Mesh(geo, decalMaterial);
      box.castShadow = false;
      box.receiveShadow = true;
      box.scale.set(0.0625, 0.0625, 0.5);
      box.position.set(0.25, -0.125, -0.25);
      this.group_.add(box);

      box = new THREE.Mesh(geo, decalMaterial);
      box.castShadow = false;
      box.receiveShadow = true;
      box.scale.set(0.01, 0.01, 0.4);
      box.position.set(0.25, -0.09, -0.25);
      this.group_.add(box);

      this.Parent.Attributes.FPSCamera.group.add(this.group_);

      const e = new entity.Entity();
      e.AddComponent(new render_component.RenderComponent({
        scene: this.Parent.Attributes.FPSCamera.group,
        resourcePath: './resources/rifle/',
        resourceName: 'scene.gltf',
        scale: new THREE.Vector3(1, 1, 1),
        emissive: new THREE.Color(0x000000),
        color: new THREE.Color(0xFFFFFF),
      }));
      this.Manager.Add(e);
      e.SetPosition(new THREE.Vector3(0.1, -0.25, -0.15));
      e.SetActive(false);
      this.gun_ = e;
    }

    OnVisible_(m) {
      this.group_.visible = m.value; // Set gun visibility based on a message
    }

    OnStep_(msg) {
      // Handle footsteps and impact decals based on player movement
      const footIndex = (msg.step % 2 == 0) ? 'L' : 'R';
      const footOffset = (msg.step % 2 == 0) ? 1 : -1;

      if (this.lastStep_ <= 0) {
        this.lastStep_ = 0.25;
        if (this.Parent.Attributes.Physics.CharacterController.onGround()) {
          this.LoadSound_('footstep.ogg');
        }
      }

      const physics = this.FindEntity('physics').GetComponent('AmmoJSController');
      const end = this.Parent.Left.clone().multiplyScalar(footOffset);
      end.add(new THREE.Vector3(0, -5, 0));
      end.add(this.Parent.Position);

      const hits = physics.RayTest(this.Parent.Position, end).filter(e => e.Name != 'player');

      if (hits.length == 0) {
        return;
      }

      const textureLoader = new THREE.TextureLoader();

      const mesh = this.FindEntity(hits[0].name);

      mesh.Attributes.Render.group.traverse(c => {
        if (c.geometry) {
          {
            const position = hits[0].position.clone();
            const eye = position.clone();
            eye.add(hits[0].normal);

            const eulerZ = new THREE.Euler();
            eulerZ.setFromQuaternion(this.Parent.Quaternion);
            eulerZ.x = 0;
            eulerZ.y = 0;
            const rotation = new THREE.Matrix4();
            rotation.lookAt(eye, position, this.Parent.Forward);
            const euler = new THREE.Euler();
            euler.setFromRotationMatrix(rotation);

            const decalMaterial = new THREE.MeshStandardMaterial( {
              color: 0xFFFFFF,
              map: textureLoader.load('./resources/footprint' + footIndex + '.png'),
              transparent: true,
              depthTest: true,
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -4,
            });
            decalMaterial.map.encoding = THREE.sRGBEncoding;
            
            const decalScale = 1.0;
            const m = new THREE.Mesh(
                new DecalGeometry(c, position, euler, new THREE.Vector3(decalScale, decalScale, decalScale * 2) ), decalMaterial);
            m.receiveShadow = true;
            this.decals_.add(m);  
          }
        }
      });
    }

    UpdateGunRecoil_() {
      // Update the gun recoil based on the cooldown
      const q1 = new THREE.Quaternion();
      const q2 = new THREE.Quaternion();
      q2.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 11);
      const t = ExpImpulse(math.sat(1.0 - this.cooldown_ / DEFAULT_COOLDOWN), 10.0);

      q1.slerp(q2, t);
      this.gun_.SetQuaternion(q1);

      const v1 = new THREE.Vector3(0.1, -0.25, -0.1);
      const v2 = new THREE.Vector3(0.1, -0.25, -0.0);

      v1.lerp(v2, t);
      this.gun_.SetPosition(v1);
    }

    Update(timeElapsedS) {
      this.soundGroup_.position.copy(this.Parent.Position);
      this.lastStep_ -= timeElapsedS;

      const input = this.GetComponent('PlayerInput');
      if (!input.isReady()) {
        return;
      }

      this.cooldown_ -= timeElapsedS;

      this.UpdateGunRecoil_();

      if (this.cooldown_ > 0.0) {
        return;
      }

      const fired = input.mouseLeftReleased();
      if (fired) {
        // Handle gun firing and raycasting to detect hits
        this.cooldown_ = DEFAULT_COOLDOWN;

        this.LoadSound_('escopeta.mp3');

        const physics = this.FindEntity('physics').GetComponent('AmmoJSController');
        const end = this.Parent.Forward.clone();
        end.multiplyScalar(100);
        end.add(this.Parent.Position);

        const offset = new THREE.Vector3(0.1, -0.125, -0.75);

        const blaster = this.FindEntity('fx').GetComponent('BlasterSystem');
        const tracer = blaster.CreateParticle();
        tracer.Start = offset.clone();
        tracer.Start.applyQuaternion(this.Parent.Quaternion);
        tracer.Start.add(this.Parent.Position);
        tracer.End = this.Parent.Forward.clone();
        tracer.End.multiplyScalar(10.0);
        tracer.End.add(this.Parent.Position);

        tracer.Velocity = tracer.End.clone();
        tracer.Velocity.sub(tracer.Start);
        tracer.Velocity.normalize();
        tracer.Velocity.multiplyScalar(5.0);
        tracer.Colours = [new THREE.Color(0x404040), new THREE.Color(0x202020)];
        tracer.Length = 10.0;
        tracer.Life = 1.0;
        tracer.TotalLife = 1.0;
        tracer.Width = 0.125;

        const hits = physics.RayTest(this.Parent.Position, end);

        if (hits.length == 0) {
          return;
        }

        for (let i = 0; i < hits.length; ++i) {
          const mesh = this.FindEntity(hits[i].name);

          if (mesh.Attributes.NPC) {
            if (mesh.Attributes.Stats.health > 0) {
              mesh.Broadcast({topic: 'shot.hit', position: hits[i].position, start: this.Parent.Position, end: end});
              return;
            }
            continue;
          }
          return;
        }
      }
    }

  };

  return {
    GunController: GunController
  };

})();
