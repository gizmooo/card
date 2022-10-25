/* eslint-disable */
import {AnimationMixer, Group, Mesh, MeshPhysicalMaterial, Texture, Vector2} from 'three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader';


const processTexture = (t: Texture): Texture => {
  // t.wrapT = MirroredRepeatWrapping;
  t.flipY = false;
  // t.rotation = Math.PI;
  // t.offset.x = -1

  // t.minFilter = NearestFilter;
  // t.magFilter = LinearFilter;
  // t.wrapS = RepeatWrapping;
  // t.wrapT = RepeatWrapping;
  return t;
}

export const getModel = (model: GLTF, map: Texture, normalMap: Texture) => {
  processTexture(map);
  processTexture(normalMap);

  const material = new MeshPhysicalMaterial({
    // color: 'red',
    // bumpMap,
    // bumpScale: 1,
    map,
    normalMap,
    normalScale: new Vector2(0.3, 0.3),
    metalness: 0.2,
    roughness: 0.45,
    reflectivity: 0.9,
    clearcoat: 0,
    // clearcoatRoughness: 1
  });

  const mixer = new AnimationMixer(model.scene);

  const clip = model.animations[0];
  const action = mixer.clipAction(clip).play();
  // this._action.loop = LoopOnce;

  model.scene.scale.setScalar(3.8);

  let top: Mesh | undefined;
  model.scene.traverse((obj) => {
    if ('isMesh' in obj) {
      const object = obj as Mesh;
      object.material = material;
      if (object.name === 'top') {
        top = object;
      }
    }
  })

  const rotation = new Group();
  const animation = new Group();
  rotation.add(model.scene);
  animation.add(rotation);

  return {
    model,
    mixer,
    clip,
    action,
    top,
    rotation,
    animation
  }
}