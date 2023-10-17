import {
    THREE, EffectComposer, FXAAShader, GTAOPass,
    MotionBlurPass, ShaderPass, RenderPass,
    UnrealBloomPass, GammaCorrectionShader,
    CSM,
} from './threeD.js';

import {LuminosityHighPassShader} from './luminosityshader.js';
import {RadialBlurShader} from './radial-blur.js';

import {entity} from "./customEntity.js";


/**
 * @fileoverview This file contains the implementation of a custom ThreeJS controller component.
 * It exports a class that extends the entity.Component class and provides methods for initializing
 * the ThreeJS renderer, camera, scene, and other objects, as well as for rendering and post-processing
 * the scene using various effects and passes.
 * @package
 */
export const threejs_component = (() => {

  const _SKY_VS = `
  varying vec3 vWorldPosition;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
  
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }`;
  
  const _SKY_FS = `
  uniform samplerCube background;
  uniform float time;
  varying vec3 vWorldPosition;

  mat3 rotationMatrixY(float angle, vec3 axis) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oneMinusC = 1.0 - c;
      return mat3(oneMinusC * axis.x * axis.x + c,  oneMinusC * axis.x * axis.y - s * axis.z,  oneMinusC * axis.x * axis.z + s * axis.y,
                  oneMinusC * axis.x * axis.y + s * axis.z,  oneMinusC * axis.y * axis.y + c,  oneMinusC * axis.y * axis.z - s * axis.x,
                  oneMinusC * axis.x * axis.z - s * axis.y,  oneMinusC * axis.y * axis.z + s * axis.x,  oneMinusC * axis.z * axis.z + c);
  }

  void main() {
    vec3 viewDir = normalize(vWorldPosition - cameraPosition);
    vec3 skyCol = textureCube(background, rotationMatrixY(time * 0.02, vec3(0.0, 1.0, 0.0)) * viewDir).rgb;
    float bloom = 0.1 * max(0.0, dot(viewDir, vec3(0.0, 0.25, 1.0)));
    gl_FragColor = vec4(skyCol, bloom);
  }
`;

  class CustomThreeJSController extends entity.Component {
    constructor() {
      super();
    }

    InitializeEntity() {
      THREE.ShaderChunk.emissivemap_fragment += '\ndiffuseColor.a = 0.0;';
        
      this.threeRenderer_ = new THREE.WebGLRenderer({
        antialias: false,
      });
      this.threeRenderer_.shadowMap.enabled = true;
      this.threeRenderer_.shadowMap.type = THREE.PCFSoftShadowMap;
      this.threeRenderer_.setPixelRatio(window.devicePixelRatio);
      this.threeRenderer_.setSize(window.innerWidth, window.innerHeight);
      this.threeRenderer_.domElement.id = 'threejs';
      this.threeRenderer_.physicallyCorrectLights = true;
      document.getElementById('container').appendChild(this.threeRenderer_.domElement);
  
      window.addEventListener('resize', () => {
        this.onWindowResize_();
      }, false);

      const fieldOfView = 60;
      const aspectRatio = 1920 / 1080;
      const nearPlane = 0.1;
      const farPlane = 1000.0;
      this.camera_ = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
      this.camera_.position.set(20, 5, 15);

      this.scene_ = new THREE.Scene();
      this.scene_.add(this.camera_);

      this.decalCamera_ = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
      this.decalCamera_.position.set(20, 5, 15);
      this.sceneDecals_ = new THREE.Scene();
      this.sceneDecals_.add(this.decalCamera_);

      this.listener_ = new THREE.AudioListener();
      this.camera_.add(this.listener_);

      this.uiCamera_ = new THREE.OrthographicCamera(
          -1, 1, 1, -1, 1, 1000);
      this.uiScene_ = new THREE.Scene();
  
      this.scene_.fog = new THREE.FogExp2(0xDFE9F3, 0.00005);
      this.sceneDecals_.fog = new THREE.FogExp2(0xDFE9F3, 0.00005);


      let light = new THREE.DirectionalLight(0xf3ebbe, 0.75);
      light.position.set(-20, 100, 20);
      light.target.position.set(0, 0, 0);
      light.intensity = 2.4;
      const lightDir = light.position.clone();
      lightDir.normalize();
      lightDir.multiplyScalar(-1);

      this.sun_ = light;

      this.csm_ = new CSM( {
        maxFar: this.camera_.farPlane,
        cascades: 4,
        mode: 'logarithmic',
        parent: this.scene_,
        shadowMapSize: 4096,
        lightDirection: lightDir,
        camera: this.camera_,
        lightNear: 1.0,
        lightFar: 1000.0,
      });
      this.csm_.fade = true;

      const lightColour = new THREE.Color(0xf3ebbe);
      for (let i = 0; i < this.csm_.lights.length; ++i) {
        this.csm_.lights[i].color = lightColour;
        this.csm_.lights[i].intensity = 1.5;
      }

      const upColour = 0xFFFF80;
      const downColour = 0x808080;
      light = new THREE.HemisphereLight(upColour, downColour, 0.75);
      light.color.setHSL( 0.6, 1, 0.6 );
      light.groundColor.setHSL( 0.095, 1, 0.75 );
      light.position.set(0, 4, 0);
      this.scene_.add(light);

      light = new THREE.AmbientLight(0xFFFFFF, 0.01);
      this.scene_.add(light);

      this.listener_ = new THREE.AudioListener();
      this.camera_.add(this.listener_);

      const parameters = {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      };
      
      const renderTarget = new THREE.WebGLRenderTarget(
          window.innerWidth, window.innerHeight, parameters);
      this.writeBuffer_ = renderTarget;
      this.readBuffer_ = renderTarget.clone();
  
      this.composer_ = new EffectComposer(this.threeRenderer_);
      this.composer_.setPixelRatio(window.devicePixelRatio);
      this.composer_.setSize(window.innerWidth, window.innerHeight);
  
      this.fxaaPass_ = new ShaderPass(FXAAShader);

      this.uiPass_ = new RenderPass(this.uiScene_, this.uiCamera_);
      this.uiPass_.clear = false;
  
      this.motionBlurPass_ = new MotionBlurPass(this.scene_, this.camera_);
      this.motionBlurPass_.samples = 32;
      this.motionBlurPass_.smearIntensity = 0.02;
      this.motionBlurPass_.interpolateGeometry = true;
      
      this.gtaoPass_ = new GTAOPass(this.scene_, this.camera_);
  
      this.bloomPass_ = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
      this.bloomPass_.radiusvalue = 0.0;

      this.bloomPass_.materialHighPassFilter = new THREE.ShaderMaterial({
        uniforms: this.bloomPass_.highPassUniforms,
        vertexShader: LuminosityHighPassShader.vertexShader,
        fragmentShader: LuminosityHighPassShader.fragmentShader,
        defines: {}
      });

      this.radialBlur_ = new ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: RadialBlurShader.uniforms,
            vertexShader: RadialBlurShader.vertexShader,
            fragmentShader: RadialBlurShader.fragmentShader
        })
      );

      this.opaquePass_ = new RenderPass(this.scene_, this.camera_);
      this.decalPass_ = new RenderPass(this.sceneDecals_, this.decalCamera_);
      this.gammaPass_ = new ShaderPass(GammaCorrectionShader);

      this.composer_.addPass(this.opaquePass_);
      this.composer_.addPass(this.gtaoPass_);
      this.composer_.addPass(this.bloomPass_);
      this.composer_.addPass(this.uiPass_);
      this.composer_.addPass(this.gammaPass_);
      this.composer_.addPass(this.fxaaPass_);

      this.LoadBackground_();
      this.onWindowResize_();
    }

    LoadBackground_() {
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
          './resources/sky/Cold_Sunset__Cam_2_Left+X.png',
          './resources/sky/Cold_Sunset__Cam_3_Right-X.png',
          './resources/sky/Cold_Sunset__Cam_4_Up+Y.png',
          './resources/sky/Cold_Sunset__Cam_5_Down-Y.png',
          './resources/sky/Cold_Sunset__Cam_0_Front+Z.png',
          './resources/sky/Cold_Sunset__Cam_1_Back-Z.png',
      ]);
      texture.encoding = THREE.sRGBEncoding;

  
      const uniforms = {
        "background": { value: texture },
        "time": { value: 0.0 },
      };
  
      const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
      const skyMat = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: _SKY_VS,
          fragmentShader: _SKY_FS,
          side: THREE.BackSide
      });

      this.sky_ = new THREE.Mesh(skyGeo, skyMat);
      this.scene_.add(this.sky_);
    }

    getMaxAnisotropy() {
      return this.threeRenderer_.capabilities.getMaxAnisotropy();
    }

    onWindowResize_() {
      this.camera_.aspectRatio = window.innerWidth / window.innerHeight;
      this.camera_.updateProjectionMatrix();
  
      this.threeRenderer_.setSize(window.innerWidth, window.innerHeight);
      this.composer_.setSize(window.innerWidth, window.innerHeight);

      this.csm_.updateFrustums();
  
      const pixelRatio = this.threeRenderer_.getPixelRatio();
      this.fxaaPass_.material.uniforms['resolution'].value.x = 1 / (
          window.innerWidth * pixelRatio);
      this.fxaaPass_.material.uniforms['resolution'].value.y = 1 / (
          window.innerHeight * pixelRatio);
    }

    swapBuffers_() {
      const tmp = this.writeBuffer_;
      this.writeBuffer_ = this.readBuffer_;
      this.readBuffer_ = tmp;
    }

    Render(timeElapsedS) {
      this.csm_.update(this.camera_.matrix);

      this.opaquePass_.clearColor = new THREE.Color(0x000000);
      this.opaquePass_.clearAlpha = 0.0;
      this.opaquePass_.render(this.threeRenderer_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.bloomPass_.render(this.threeRenderer_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.uiPass_.render(this.threeRenderer_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);

      this.radialBlur_.uniforms.center.value.set(window.innerWidth * 0.5, window.innerHeight * 0.5);
      this.radialBlur_.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
      this.radialBlur_.render(this.threeRenderer_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.swapBuffers_();

      this.fxaaPass_.render(this.threeRenderer_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.swapBuffers_();

      this.gammaPass_.renderToScreen = true;
      this.gammaPass_.render(this.threeRenderer_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
    }

    Update(timeElapsed) {
      const player = this.FindEntity('player');
      if (!player) {
        return;
      }
      const pos = player._position;
  
      this.sun_.position.copy(pos);
      this.sun_.position.add(new THREE.Vector3(-20, 100, 20));
      this.sun_.target.position.copy(pos);
      this.sun_.updateMatrixWorld();
      this.sun_.target.updateMatrixWorld();

      if (this.sky_) {
        this.sky_.material.uniforms.time.value += timeElapsed;
      }

      this.sky_.position.copy(pos);
    }
  }

  return {
      CustomThreeJSController: CustomThreeJSController,
  };
})();