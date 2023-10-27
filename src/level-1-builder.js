import {THREE} from './threeD.js';

import {entity} from './customEntity.js';
import {math} from './math.js';
import {render_component} from './render-component.js';
import {basic_rigid_body} from './basic-rigid-body.js';

export const level_1_builder = (() => {

  class Level1Builder extends entity.Component {
    constructor(params) {
      super();

      const self = this; 

      const startingMinutes = 5;
      let time = startingMinutes * 60;

      document.addEventListener('keydown',(e)=>{
        console.log(e.key);
        if(e.key == 'Escape'){
          self.togglePause();

        }
      });

      const countdownEl = document.getElementById('countdown');

      setInterval(function () {updateCountdown(self.paused)}, 1000);

      function updateCountdown (_paused) {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;

        if(!_paused){
          seconds = seconds < 10 ? '0' + seconds : seconds;

          countdownEl.innerHTML = `${minutes}:${seconds}`;
          time--;
        }else{
          countdownEl.innerHTML = `${minutes}:${seconds}`;
        }
        if (time < 0) {
          time = 0;
        
          self.GameOver();
        }
        
      }
      this.params_ = params;
      this.spawned_ = false;
      this.materials_ = {};
    }

    LoadMaterial_(albedoName, normalName, roughnessName, metalnessName,envMapName) {
      const textureLoader = new THREE.TextureLoader();
      const albedo = textureLoader.load('./resources/textures/' + albedoName);
      albedo.anisotropy = this.FindEntity('threejs').GetComponent('ThreeJSController').getMaxAnisotropy();
      albedo.wrapS = THREE.RepeatWrapping;
      albedo.wrapT = THREE.RepeatWrapping;
      albedo.encoding = THREE.sRGBEncoding;

      const metalness = textureLoader.load('./resources/textures/' + metalnessName);
      metalness.anisotropy = this.FindEntity('threejs').GetComponent('ThreeJSController').getMaxAnisotropy();
      metalness.wrapS = THREE.RepeatWrapping;
      metalness.wrapT = THREE.RepeatWrapping;

      const normal = textureLoader.load('./resources/textures/' + normalName);
      normal.anisotropy = this.FindEntity('threejs').GetComponent('ThreeJSController').getMaxAnisotropy();
      normal.wrapS = THREE.RepeatWrapping;
      normal.wrapT = THREE.RepeatWrapping;

      const roughness = textureLoader.load('./resources/textures/' + roughnessName);
      roughness.anisotropy = this.FindEntity('threejs').GetComponent('ThreeJSController').getMaxAnisotropy();
      roughness.wrapS = THREE.RepeatWrapping;
      roughness.wrapT = THREE.RepeatWrapping;

      const envMap = textureLoader.load('./resources/textures/' + envMapName);
      envMap.mapping = THREE.CubeReflectionMapping;

      const material = new THREE.MeshStandardMaterial({
        map: albedo,
        color: 0x303030,

        envMap: envMap, // add the environment map for reflection
        envMapIntensity: 1.0, // adjust as needed
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

        vec3 hash( vec3 p ) // replace this by something better. really. do
        {
          p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
                dot(p,vec3(269.5,183.3,246.1)),
                dot(p,vec3(113.5,271.9,124.6)));

          return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }

        // return value noise (in x) and its derivatives (in yzw)
        vec4 noised( in vec3 x )
        {
            // grid
            vec3 i = floor(x);
            vec3 w = fract(x);
            
            #if 1
            // quintic interpolant
            vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);
            vec3 du = 30.0*w*w*(w*(w-2.0)+1.0);
            #else
            // cubic interpolant
            vec3 u = w*w*(3.0-2.0*w);
            vec3 du = 6.0*w*(1.0-w);
            #endif    
            
            // gradients
            vec3 ga = hash( i+vec3(0.0,0.0,0.0) );
            vec3 gb = hash( i+vec3(1.0,0.0,0.0) );
            vec3 gc = hash( i+vec3(0.0,1.0,0.0) );
            vec3 gd = hash( i+vec3(1.0,1.0,0.0) );
            vec3 ge = hash( i+vec3(0.0,0.0,1.0) );
          vec3 gf = hash( i+vec3(1.0,0.0,1.0) );
            vec3 gg = hash( i+vec3(0.0,1.0,1.0) );
            vec3 gh = hash( i+vec3(1.0,1.0,1.0) );
            
            // projections
            float va = dot( ga, w-vec3(0.0,0.0,0.0) );
            float vb = dot( gb, w-vec3(1.0,0.0,0.0) );
            float vc = dot( gc, w-vec3(0.0,1.0,0.0) );
            float vd = dot( gd, w-vec3(1.0,1.0,0.0) );
            float ve = dot( ge, w-vec3(0.0,0.0,1.0) );
            float vf = dot( gf, w-vec3(1.0,0.0,1.0) );
            float vg = dot( gg, w-vec3(0.0,1.0,1.0) );
            float vh = dot( gh, w-vec3(1.0,1.0,1.0) );
          
            // interpolations
            return vec4( va + u.x*(vb-va) + u.y*(vc-va) + u.z*(ve-va) + u.x*u.y*(va-vb-vc+vd) + u.y*u.z*(va-vc-ve+vg) + u.z*u.x*(va-vb-ve+vf) + (-va+vb+vc-vd+ve-vf-vg+vh)*u.x*u.y*u.z,    // value
                          ga + u.x*(gb-ga) + u.y*(gc-ga) + u.z*(ge-ga) + u.x*u.y*(ga-gb-gc+gd) + u.y*u.z*(ga-gc-ge+gg) + u.z*u.x*(ga-gb-ge+gf) + (-ga+gb+gc-gd+ge-gf-gg+gh)*u.x*u.y*u.z +   // derivatives
                          du * (vec3(vb,vc,ve) - va + u.yzx*vec3(va-vb-vc+vd,va-vc-ve+vg,va-vb-ve+vf) + u.zxy*vec3(va-vb-ve+vf,va-vb-vc+vd,va-vc-ve+vg) + u.yzx*u.zxy*(-va+vb+vc-vd+ve-vf-vg+vh) ));
        }

        float sdCircle( vec3 p, float r )
        {
            return length(p) - r;
        }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5*(a-b)/k, 0.0, 1.0);
          return mix(a, b, h) - k*h*(1.0-h);
        }

        const mat3 m3  = mat3( 0.00,  0.80,  0.60,
          -0.80,  0.36, -0.48,
          -0.60, -0.48,  0.64 );
        const mat3 m3i = mat3( 0.00, -0.80, -0.60,
           0.80,  0.36, -0.48,
           0.60, -0.48,  0.64 );
        const mat2 m2 = mat2(  0.80,  0.60,
          -0.60,  0.80 );
        const mat2 m2i = mat2( 0.80, -0.60,
           0.60,  0.80 );

        vec4 fbmd_7( in vec3 x )
        {
            float f = 1.92;
            float s = 0.5;
            float a = 0.0;
            float b = 0.5;
            vec3  d = vec3(0.0);
            mat3  m = mat3(1.0,0.0,0.0,
                           0.0,1.0,0.0,
                           0.0,0.0,1.0);
            for( int i=0; i<3; i++ )
            {
                vec4 n = noised(x);
                a += b*n.x;          // accumulate values		
                d += b*m*n.yzw;      // accumulate derivatives
                b *= s;
                x = f*m3*x;
                m = f*m3i*m;
            }
            return vec4( a, d );
        }

        vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
        {
            return a + b*cos( 6.28318*(c*t+d) );
        }

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

      const csm = this.FindEntity('threejs').GetComponent('ThreeJSController').csm_;
      csm.setupMaterial(material);

      return material;
    }

    BuildHackModel_() {
      this.materials_.checkerboard = this.LoadMaterial_(
          'building.png', null, null, null);
          this.materials_.pavement = this.LoadMaterial_(
            'paver.png', null, null, null);

      const ground = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1, 10, 10, 10),
        this.materials_.pavement
      );
      ground.castShadow = true;
      ground.receiveShadow = true;

      this.FindEntity('loader').GetComponent('LoadController').AddModel(ground, 'built-in.', 'ground');

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1, 10, 10, 10),
        this.materials_.checkerboard
      );
      box.castShadow = true;
      box.receiveShadow = true;

      this.FindEntity('loader').GetComponent('LoadController').AddModel(box, 'built-in.', 'box');

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

      const e = new entity.Entity();
      e.AddComponent(new render_component.RenderComponent({
        scene: this.params_.scene,
        resourcePath: 'built-in.',
        resourceName: 'ground',
        scale: new THREE.Vector3(100, 20, 100),
        emissive: new THREE.Color(0x000000),
        color: new THREE.Color(0xFFFFFF),
      }));
      e.AddComponent(new basic_rigid_body.BasicRigidBody({
  
        box: new THREE.Vector3(100, 20, 100)
      }));

      this.Manager.Add(e, 'ground');
      e.SetPosition(new THREE.Vector3(0, 0, 0));
      e.SetActive(false);

      for (let i = -1; i <= 1; ++i) {
        for (let j = -1; j <= 1; ++j) {
          if (i == 0 && j == 0) {
            continue;
          }
          const building = new entity.Entity();
          building.AddComponent(new render_component.RenderComponent({
            scene: this.params_.scene,
            resourcePath: 'built-in.',
            resourceName: 'box',
            scale: new THREE.Vector3(20, 50, 8),
            emissive: new THREE.Color(0x000000),
            color: new THREE.Color(0xFFFFFF),
          }));
          building.AddComponent(new basic_rigid_body.BasicRigidBody({
            box: new THREE.Vector3(20, 50, 8),
          }));
      
          this.Manager.Add(building);
          building.SetPosition(new THREE.Vector3(i * 50, math.rand_range(-30.0, -10.0), j * 50));
          if (i == 0 && j == -1) {
            building.SetPosition(new THREE.Vector3(0, 0, -50));
          }
          building.SetActive(false);
        }
      }
      
      for (let x = -2; x <= 2; ++x) {
        for (let y = -2; y <= 2; ++y) {
          const e = new entity.Entity();
          e.AddComponent(new render_component.RenderComponent({
            scene: this.params_.scene,
            resourcePath: 'built-in.',
            resourceName: 'ground',
            scale: new THREE.Vector3(100, 20, 50),
            emissive: new THREE.Color(0x000000),
            color: new THREE.Color(0xFFFFFF),
          }));
          e.AddComponent(new basic_rigid_body.BasicRigidBody({
            box: new THREE.Vector3(100, 20, 50)
          }));
    
          this.Manager.Add(e);
          e.SetPosition(new THREE.Vector3(x * 50, math.rand_range(-30.0, -10.0), y * 50));
          e.SetActive(false);
        }
      }
      for (let i = -3; i <= 3; ++i) {
        for (let j = -3; j <= 3; ++j) {
          if (i == 0 && j == 0) {
            continue;
          }
          const building = new entity.Entity();
          building.AddComponent(new render_component.RenderComponent({
            scene: this.params_.scene,
            resourcePath: 'built-in.',
            resourceName: 'box',
            scale: new THREE.Vector3(20, 100, 8),
            emissive: new THREE.Color(0x000000),
            color: new THREE.Color(0xFFFFFF),
          }));
          building.AddComponent(new basic_rigid_body.BasicRigidBody({
            box: new THREE.Vector3(20, 100, 8),
          }));
    
          this.Manager.Add(building, 'building.' + i + '.' + j);
          building.SetPosition(new THREE.Vector3(i * 50, 1, j * 50));
          building.SetActive(false);
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