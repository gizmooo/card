/* eslint-disable */
import {
  ACESFilmicToneMapping,
  AmbientLight, Color, Group,
  HemisphereLight, LinearFilter,
  Mesh,
  MeshLambertMaterial, MeshPhysicalMaterial, MirroredRepeatWrapping, NearestFilter,
  PerspectiveCamera, PointLight, RepeatWrapping,
  Scene, sRGBEncoding, Texture,
  TextureLoader, Vector2, Vector3,
  WebGLRenderer
} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader';


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

export class CardBoxInstance{
  private _vw = 1;
  private _vh = 1;
  private readonly _canvas: HTMLCanvasElement;
  private readonly _onResize = () => this._resize();
  private readonly _tickHandler = () => this._tick();
  private readonly _onMove = (e: MouseEvent) => this._move(e);
  private readonly _renderer: WebGLRenderer;
  private readonly _scene = new Scene();
  private readonly _group = new Group();
  private readonly _camera: PerspectiveCamera;
  private _raf: ReturnType<typeof requestAnimationFrame> = -1;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;

    this._renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      // logarithmicDepthBuffer: true // if textures blinking
    });
    // this._renderer.shadowMap.enabled = settings.shadow;
    this._renderer.setPixelRatio(window.devicePixelRatio || 1);
    // this._renderer.physicallyCorrectLights = true;
    // this._renderer.toneMapping = ACESFilmicToneMapping;
    // this._renderer.outputEncoding = sRGBEncoding;

    this._scene.add(this._group);
    this._group.position.z = -1;
    this._scene.background = new Color('black');
    this._camera = new PerspectiveCamera(60, 1, 0.01, 200000);

    this._createLight();

    this._resize();
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('resize', this._onResize);

    this._load()
      .then(() => {
        this._resize();
        this._raf = requestAnimationFrame(this._tickHandler);
      })
  }

  public destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('resize', this._onResize);
  }

  private _createLight() {
    const ambient = new AmbientLight( 0xFFA24B, 0.2);
    const point = new PointLight( 0xFFE3BA, 2.2, 32 , 1.2);
    point.position.set( 10, 5, 15 );
    const point2 = new PointLight( 0xFFE3BA, 2, 13, 2);
    point2.position.set( 6, 0, 10 );

    this._scene.add(ambient, point, point2);

    return {ambient, point};
  }

  private async _load() {
    const mLoader = new GLTFLoader();
    const tLoader = new TextureLoader();
    // const rLoader = new RGBELoader();

    const [bumpMap, map, normalMap, model] = await Promise.all([
      tLoader.loadAsync('./models/bump.jpg'),
      tLoader.loadAsync('./models/diffuse_red_dots.png'),
      tLoader.loadAsync('./models/normal.png'),
      mLoader.loadAsync('./models/card_box_05_anim_06.gltf'),
      // rLoader.loadAsync('./models/HDR_1.hdr')
    ]);

    processTexture(bumpMap);
    processTexture(map);
    processTexture(normalMap);
    // hdr.flipY = false;

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
    })

    model.scene.scale.copy(new Vector3(5, 5, 5))
    // model.scene.position.z = -1;

    model.scene.traverse((obj) => {
      if ('isMesh' in obj) {
        const object = obj as Mesh;
        object.material = material;
      }
    })

    this._group.add(model.scene);
  }
  private _resize() {
    this._vw = window.innerWidth;
    this._vh = window.innerHeight;

    this._renderer.setSize(this._vw, this._vh);

    this._camera.aspect = this._vw / this._vh;
    this._camera.updateProjectionMatrix();
  }
  private _tick() {
    this._renderer.render(this._scene, this._camera);

    this._raf = requestAnimationFrame(this._tickHandler);
  }

  private _move(e: MouseEvent)  {
    const pos = (e.clientX - this._vw / 2) / this._vw;

    this._group.rotation.y = Math.PI * pos * 2
  }
}