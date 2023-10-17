import {THREE} from './threeD.js';

import {entity} from './customEntity.js';

import {math} from './math.js';

import {render_component} from './render-component.js';
import {basic_rigid_body} from './rigidBodyPhysics.js';
import {mesh_rigid_body} from './mesh-rigid-body.js';

export const level_1_builder = (() => {

  class Level1Builder extends entity.Component {
    constructor(params) {
      super();

      const self = this; 

      const startingMinutes = 5;
      let time = startingMinutes * 60;

      const countdownEl = document.getElementById('countdown');

      setInterval(updateCountdown, 1000);

      function updateCountdown () {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;

        seconds = seconds < 10 ? '0' + seconds : seconds;

        countdownEl.innerHTML = `${minutes}:${seconds}`;
        time--;
        if (time < 0) {
          time = 0;
        
          self.GameOver();
        }
        
      }

      this.params_ = params;
      this.spawned_ = false;
      this.materials_ = {};
    }

    LoadMaterial_(albedoName, normalName, roughnessName, metalnessName) {
      const textureLoader = new THREE.TextureLoader();
      const albedo = textureLoader.load('./resources/textures/' + albedoName);
      albedo.anisotropy = this.FindEntity('threejs').GetComponent('CustomThreeJSController').getMaxAnisotropy();
      albedo.wrapS = THREE.RepeatWrapping;
      albedo.wrapT = THREE.RepeatWrapping;
      albedo.encoding = THREE.sRGBEncoding;

      const metalness = textureLoader.load('./resources/textures/' + metalnessName);
      metalness.anisotropy = this.FindEntity('threejs').GetComponent('CustomThreeJSController').getMaxAnisotropy();
      metalness.wrapS = THREE.RepeatWrapping;
      metalness.wrapT = THREE.RepeatWrapping;

      const normal = textureLoader.load('./resources/textures/' + normalName);
      normal.anisotropy = this.FindEntity('threejs').GetComponent('CustomThreeJSController').getMaxAnisotropy();
      normal.wrapS = THREE.RepeatWrapping;
      normal.wrapT = THREE.RepeatWrapping;

      const roughness = textureLoader.load('./resources/textures/' + roughnessName);
      roughness.anisotropy = this.FindEntity('threejs').GetComponent('CustomThreeJSController').getMaxAnisotropy();
      roughness.wrapS = THREE.RepeatWrapping;
      roughness.wrapT = THREE.RepeatWrapping;

      const material = new THREE.MeshStandardMaterial({
        map: albedo,
        color: 0x303030,
        // metalnessMap: metalness,
        // normalMap: normal,
        // roughnessMap: roughness,
      });

      material.onBeforeCompile = (shader) => {
        shader.uniforms.iTime = { value: 0.0 };

        shader.vertexShader = shader.vertexShader.replace('#include <common>',
        `
        #include <common>
        varying vec4 vWorldPosition;
        varying vec3 vWorldNormal;
        `);
        shader.vertexShader = shader.vertexShader.replace('#include <fog_vertex>',
        `
        #include <fog_vertex>
        vWorldPosition = worldPosition;
        vWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
        `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
        `
        #include <common>
        varying vec4 vWorldPosition;
        varying vec3 vWorldNormal;
        uniform float iTime;
        `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>

        float size = 1.0;
        vec2 posXY = mod(floor(vWorldPosition.xy / size), size);  
        vec2 posXZ = mod(floor(vWorldPosition.xz / size), 10.0);  
        vec2 posYZ = mod(floor(vWorldPosition.yz), 1.0);

        vec3 weights = abs(vWorldNormal.xyz);
        weights /= dot(weights, vec3(1.0));

        float maxWeight = max(weights.x, max(weights.y, weights.z));

        vec2 coords;
        if (maxWeight == weights.z) {
          coords = vWorldPosition.xy / size;
        } else if (maxWeight == weights.y) {
          coords = vWorldPosition.xz / size;
        } else {
          coords = vWorldPosition.yz / size;
        }

        diffuseColor.xyz = mapTexelToLinear(texture(map, coords)).xyz;

        metalnessFactor = 0.1 * (1.0 - diffuseColor.x);
        roughnessFactor = diffuseColor.x * 0.5;

        `);
        material.userData.shader = shader;
      };
  
      material.customProgramCacheKey = () => {
        return albedo;
      };

      const csm = this.FindEntity('threejs').GetComponent('CustomThreeJSController').csm_;
      csm.setupMaterial(material);

      return material;
    }

    BuildHackModel_() {
      this.materials_.checkerboard = this.LoadMaterial_(
          'whitesquare.png', null, null, null);
      this.materials_.vintageTile = this.LoadMaterial_(
          'vintage-tile1_albedo.png', 'vintage-tile1_normal.png',
          'vintage-tile1_roughness.png', 'vintage-tile1_metallic.png');
      this.materials_.hexagonPavers = this.LoadMaterial_(
          'hexagon-pavers1_albedo.png', 'hexagon-pavers1_normal.png',
          'hexagon-pavers1_roughness.png', 'hexagon-pavers1_metallic.png');
      this.materials_.brokenDownConcrete2 = this.LoadMaterial_(
          'broken_down_concrete2_albedo.png', 'broken_down_concrete2_normal.png',
          'broken_down_concrete2_roughness.png', 'broken_down_concrete2_metallic.png');

      const ground = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1, 10, 10, 10),
          this.materials_.brokenDownConcrete2);
      ground.castShadow = true;
      ground.receiveShadow = true;

      this.FindEntity('loader').GetComponent('LoadController').AddModel(ground, 'built-in.', 'ground');

      const box = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1, 10, 10, 10),
          this.materials_.checkerboard);
      box.castShadow = true;
      box.receiveShadow = true;

      this.FindEntity('loader').GetComponent('LoadController').AddModel(box, 'built-in.', 'box');

      const column = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1),
          this.materials_.hexagonPavers);
      column.castShadow = true;
      column.receiveShadow = true;

      this.FindEntity('loader').GetComponent('LoadController').AddModel(column, 'built-in.', 'column');
    
      this.currentTime_ = 0.0;


      
    }

    GameOver() {

      
     // Display loading screen
      const loadingScreen = document.createElement('div');
      loadingScreen.style.position = 'absolute';
      loadingScreen.style.top = '0';
      loadingScreen.style.left = '0';
      loadingScreen.style.width = '100%';
      loadingScreen.style.heightvalue = '100%';
      loadingScreen.style.backgroundColor = '#000';
      loadingScreen.style.opacity = '0.5';
      loadingScreen.style.display = 'flex';
      loadingScreen.style.justifyContent = 'center';
      loadingScreen.style.alignItems = 'center';
      loadingScreen.innerHTML = 'GAME-OVER';
      loadingScreen.style.fontSize = '200px';
      document.body.appendChild(loadingScreen);
    
      // Load and initialize the next level here
      //const levelBuilder = new level_2_builder.Level2Builder({});
      //levelBuilder.LoadMaterial_('albedo.jpg', 'normal.jpg', 'roughness.jpg', 'metalness.jpg');
      //levelBuilder.BuildHackModel_();
      //levelBuilder.Update(0.0);
     
      
      // Hide loading screen
      //document.body.removeChild(loadingScreen);
      //console.log('Moving to next level...');
    }
    
    
    Update(timeElapsed) {

      this.currentTime_ += timeElapsed;

      if (this.materials_.checkerboard && this.materials_.checkerboard.userData.shader) {
        this.materials_.checkerboard.userData.shader.uniforms.iTime.value = this.currentTime_;
        this.materials_.checkerboard.needsUpdate = true;
      }

      if (this.spawned_) {
        return;
      }

      this.spawned_ = true;

      this.BuildHackModel_();
const e = new entity.CustomEntity();
e.addEntityComponent(new render_component.RenderComponent({
  scene: this.params_.scene,
  resourcePath: 'built-in.',
  resourceName: 'ground',
  scale: new THREE.Vector3(100, 20, 100),
  emissive: new THREE.Color(0x000000),
  color: new THREE.Color(0xFFFFFF),
}));
e.addEntityComponent(new basic_rigid_body.BasicRigidBody({
  box: new THREE.Vector3(100, 20, 100)
}));

this.Manager.Add(e, 'ground');
e.SetPosition(new THREE.Vector3(0, 0, 0));
e.setActiveStatus(false);

for (let x = -2; x <= 2; ++x) {
  for (let y = -2; y <= 2; ++y) {
    const e = new entity.CustomEntity();
    e.addEntityComponent(new render_component.RenderComponent({
      scene: this.params_.scene,
      resourcePath: 'built-in.',
      resourceName: 'ground',
      scale: new THREE.Vector3(100, 20, 50),
      emissive: new THREE.Color(0x000000),
      color: new THREE.Color(0xFFFFFF),
    }));
    e.addEntityComponent(new basic_rigid_body.BasicRigidBody({
      box: new THREE.Vector3(50, 20, 50)
    }));

    this.Manager.Add(e);
    e.SetPosition(new THREE.Vector3(x * 50, 0, y * 50));
    e.setActiveStatus(false);

    const building = new entity.CustomEntity();
    building.addEntityComponent(new render_component.RenderComponent({
      scene: this.params_.scene,
      resourcePath: 'built-in.',
      resourceName: 'box',
      scale: new THREE.Vector3(20, 100, 8),
      emissive: new THREE.Color(0x000000),
      color: new THREE.Color(0xFFFFFF),
    }));
    building.addEntityComponent(new basic_rigid_body.BasicRigidBody({
      box: new THREE.Vector3(20, 100, 8),
    }));

    this.Manager.Add(building, 'building.' + x + '.' + y);
    building.SetPosition(new THREE.Vector3(x * 50, 50, y * 50));
    building.setActiveStatus(false);
  }
}

      this.FindEntity('spawners').GetComponent('TargetSpawner').Spawn({
        scene: this.params_.scene,
        position: new THREE.Vector3(0, 2, 5)
      });

      // this.FindEntity('spawners').GetComponent('TargetSpawner').Spawn({
      //   scene: this.params_.scene,
      //   position: new THREE.Vector3(-100, 50, -100)
      // });

      // this.FindEntity('spawners').GetComponent('TargetSpawner').Spawn({
      //   scene: this.params_.scene,
      //   position: new THREE.Vector3(-100, 50, -5)
      // });

    }
    
  };

  return {
    Level1Builder: Level1Builder
  };

})();




