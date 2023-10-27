import {
    THREE, EffectComposer, FXAAShader, GTAOPass,
    MotionBlurPass, ShaderPass, RenderPass,
    UnrealBloomPass, GammaCorrectionShader,
    CSM,
} from './threeD.js';

import {LuminosityHighPassShader} from './luminosityshader.js';

import {entity} from "./customEntity.js";


/**
 * @fileoverview This file contains the implementation of a ThreeJS controller component.
 * It exports a class that extends entity.Component and provides methods to initialize the ThreeJS renderer,
 * camera, scene, lights, and post-processing effects.
 * It also defines two shader chunks for the sky vertex and fragment shaders.
 * @requires THREE, CSM, EffectComposer, ShaderPass, FXAAShader, RenderPass, MotionBlurPass
 */
/**
 * @fileoverview This file contains the ThreeJSController class and the vertex and fragment shaders for the sky and stars.
 * @typedef {Object} ThreeJSController
 * @property {function} constructor - The constructor function for the ThreeJSController class.
 * @property {function} InitEntity - Initializes the ThreeJSController entity.
 * @property {THREE.WebGLRenderer} threejs_ - The WebGLRenderer instance used for rendering.
 * @property {THREE.PerspectiveCamera} camera_ - The PerspectiveCamera instance used for the scene.
 * @property {THREE.Scene} scene_ - The Scene instance used for the scene.
 * @property {THREE.PerspectiveCamera} decalCamera_ - The PerspectiveCamera instance used for the decals.
 * @property {THREE.Scene} sceneDecals_ - The Scene instance used for the decals.
 * @property {THREE.AudioListener} listener_ - The AudioListener instance used for the camera.
 * @property {THREE.OrthographicCamera} uiCamera_ - The OrthographicCamera instance used for the UI.
 * @property {THREE.Scene} uiScene_ - The Scene instance used for the UI.
 * @property {THREE.DirectionalLight} sun_ - The DirectionalLight instance used for the sun.
 * @property {CSM} csm_ - The CSM instance used for the cascaded shadow maps.
 * @property {THREE.WebGLRenderTarget} writeBuffer_ - The WebGLRenderTarget instance used for the write buffer.
 * @property {THREE.WebGLRenderTarget} readBuffer_ - The WebGLRenderTarget instance used for the read buffer.
 * @property {EffectComposer} composer_ - The EffectComposer instance used for the post-processing effects.
 * @property {ShaderPass} fxaaPass_ - The ShaderPass instance used for the FXAA post-processing effect.
 * @property {RenderPass} uiPass_ - The RenderPass instance used for the UI.
 * @property {MotionBlurPass} motionBlurPass_ - The MotionBlurPass instance used for the motion blur post-processing effect.
 * @const {string} _SKY_VS - The vertex shader for the sky.
 * @const {string} _SKY_FS - The fragment shader for the sky and stars.
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
  uniform samplerCube stars;
  uniform float time;
  
  varying vec3 vWorldPosition;
  
  void main() {
    vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
    vec3 sunDirection = normalize(vec3(0.0, 0.25, 1.0));
    vec3 sky = sRGBToLinear(textureCube(background, viewDirection)).xyz;

    float c1 = cos(time * 0.02);
    float s1 = sin(time * 0.02);
    float c2 = cos(time * 0.0075);
    float s2 = sin(time * 0.0075);
    mat3 r1 = mat3(
        1.0, 0.0, 0.0,
        0.0, c1, -s1,
        0, s1, c1);
    mat3 r2 = mat3(
        c2, 0.0, s2,
        0.0, 1.0, 0.0,
        -s2, 0.0, c2);
    vec3 stars = sRGBToLinear(textureCube(stars, r1 * r2 * viewDirection)).xyz;
  
  
    sky = pow(sky, vec3(1.5, 1.5, 1.2));

    vec3 luma = vec3( 0.299, 0.587, 0.114 );
    float starAlpha = clamp(dot(sky, luma) + 0.5, 0.0, 1.0);
    starAlpha = pow(starAlpha, 1.5);
    sky = mix(stars, sky, starAlpha);

    float bloom = 0.2 * pow(max(0.0, dot(viewDirection, sunDirection)), 16.0);
    gl_FragColor = vec4(sky * (1.0 - bloom * 2.0), bloom);
  }`;


  class ThreeJSController extends entity.Component {
    constructor() {
      super();
    }

    InitEntity() {
      THREE.ShaderChunk.emissivemap_fragment += '\ndiffuseColor.a = 0.0;';
        
      this.threejs_ = new THREE.WebGLRenderer({
        antialias: false,
      });
      this.threejs_.shadowMap.enabled = true;
      this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
      this.threejs_.setPixelRatio(window.devicePixelRatio);
      this.threejs_.setSize(window.innerWidth, window.innerHeight);
      this.threejs_.domElement.id = 'threejs';
      this.threejs_.physicallyCorrectLights = true;
  
      document.getElementById('container').appendChild(this.threejs_.domElement);
  
      window.addEventListener('resize', () => {
        this.onWindowResize_();
      }, false);

      const fov = 60;
      const aspect = 1920 / 1080;
      const near = 0.1;
      const far = 1000.0;
      this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this.camera_.position.set(20, 5, 15);

      this.scene_ = new THREE.Scene();
      this.scene_.add(this.camera_);

      this.decalCamera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
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
        maxFar: this.camera_.far,
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
  
      this.composer_ = new EffectComposer(this.threejs_);
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
      this.bloomPass_.radius = 0.0;

      this.bloomPass_.materialHighPassFilter = new THREE.ShaderMaterial({
        uniforms: this.bloomPass_.highPassUniforms,
        vertexShader: LuminosityHighPassShader.vertexShader,
        fragmentShader: LuminosityHighPassShader.fragmentShader,
        defines: {}
      });


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
      return this.threejs_.capabilities.getMaxAnisotropy();
    }

    onWindowResize_() {
      this.camera_.aspect = window.innerWidth / window.innerHeight;
      this.camera_.updateProjectionMatrix();
  
      this.threejs_.setSize(window.innerWidth, window.innerHeight);
      this.composer_.setSize(window.innerWidth, window.innerHeight);

      this.csm_.updateFrustums();
  
      const pixelRatio = this.threejs_.getPixelRatio();
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
      this.opaquePass_.render(this.threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);

      this.bloomPass_.render(this.threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.uiPass_.render(this.threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);

      this.fxaaPass_.render(this.threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.swapBuffers_();

      this.gammaPass_.renderToScreen = true;
      this.gammaPass_.render(this.threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
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
      ThreeJSController: ThreeJSController,
  };
})();