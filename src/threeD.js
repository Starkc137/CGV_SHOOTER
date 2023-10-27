
import * as THREE from 'https://cdn.skypack.dev/three@0.130.1';

import {EffectComposer} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/postprocessing/EffectComposer.js';
import {ShaderPass} from 'https://cdn.skypack.dev/three@0.130.1/examples//jsm/postprocessing/ShaderPass.js';
import {GammaCorrectionShader} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/shaders/GammaCorrectionShader.js';
import {RenderPass} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/postprocessing/RenderPass.js';
import {FXAAShader} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/shaders/FXAAShader.js';
import {CopyShader} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/shaders/CopyShader.js';
import {ACESFilmicToneMappingShader} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/shaders/ACESFilmicToneMappingShader.js';
import {UnrealBloomPass} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/postprocessing/UnrealBloomPass.js';

import {FBXLoader} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/GLTFLoader.js';
import {SkeletonUtils} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/utils/SkeletonUtils.js';
import {DecalGeometry} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/geometries/DecalGeometry.js';

import {MotionBlurPass} from './third_party/motionBlurPass/src/MotionBlurPass.js';
import {GTAOPass} from './third_party/gtaoPass/src/GTAOPass.js';

import {CSM} from './third_party/csm/three-csm.js';


/**
 * This module exports several Three.js classes and modules used in CGV_SHOOTER project.
 * @module threeD
 */
/**
 * This module exports several objects from the Three.js library, as well as additional modules for post-processing effects and loaders.
 * @module threeD
 * @exports THREE
 * @exports EffectComposer
 * @exports ShaderPass
 * @exports GammaCorrectionShader
 * @exports RenderPass
 * @exports FXAAShader
 * @exports CopyShader
 * @exports UnrealBloomPass
 * @exports ACESFilmicToneMappingShader
 * @exports FBXLoader
 * @exports GLTFLoader
 * @exports SkeletonUtils
 * @exports DecalGeometry
 * @exports GTAOPass
 * @exports MotionBlurPass
 * @exports CSM
 */
export {
  THREE, EffectComposer, ShaderPass, GammaCorrectionShader, RenderPass,
  FXAAShader, CopyShader, UnrealBloomPass, ACESFilmicToneMappingShader,
  FBXLoader, GLTFLoader, SkeletonUtils, DecalGeometry,
  GTAOPass, MotionBlurPass, CSM,
};
