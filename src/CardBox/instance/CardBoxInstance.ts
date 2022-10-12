/* eslint-disable */
import {
  AmbientLight,
  AnimationAction,
  AnimationClip,
  AnimationMixer, BufferGeometry,
  Clock,
  Color,
  Group,
  LoopOnce, Material,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from "./libs/InertiaPlugin";

gsap.registerPlugin(Draggable, InertiaPlugin);


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

export type EventHandler = () => void;

export class CardBoxInstance{
  private _isLoaded = false;
  private _isComplete = false;
  private _isDestroyed = false;
  private _vw = 1;
  private _vh = 1;
  private _x = 1;
  private _pos = {
    x: 0,
    y: 0
  }
  private _animation = {
    // handPosX:
  }
  private readonly _container: HTMLDivElement;
  private readonly _hand: {
    el: HTMLDivElement;
    inner: HTMLDivElement;
  };
  private _onLoad?: EventHandler;
  private _onComplete?: EventHandler;

  private readonly _renderer: WebGLRenderer;
  private readonly _scene = new Scene();
  private readonly _group = new Group();
  private readonly _modelGroup = new Group();
  private readonly _camera: PerspectiveCamera;
  private readonly _clock = new Clock();
  private _mixer?: AnimationMixer;
  private _clip?: AnimationClip;
  private _action?: AnimationAction;
  private _top?: Mesh;
  private readonly _draggable: Draggable;

  private readonly _onResize = () => this._resize();
  private readonly _tickHandler = () => this._tick();
  // private readonly _onMove = (e: MouseEvent) => this._move(e);

  private _raf: ReturnType<typeof requestAnimationFrame> = -1;

  constructor(container: HTMLDivElement, cover: string) {
    this._container = container;

    this._renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      // logarithmicDepthBuffer: true // if textures blinking
    });
    this._container.appendChild(this._renderer.domElement);
    this._hand = this._createHand();
    this._renderer.setPixelRatio(window.devicePixelRatio || 1);

    this._scene.add(this._group);
    this._group.position.z = -10;
    this._group.position.y = -1;
    this._group.rotation.y = -Math.PI * 3;

    this._camera = new PerspectiveCamera(60, 1, 0.01, 200000);

    this._createLights();

    this._draggable = this._createDrag(container);

    this._resize();
    // window.addEventListener('mousemove', this._onMove);
    window.addEventListener('resize', this._onResize);

    this._load()
      .then(() => {
        if (this._isDestroyed) return;

        this._resize();
        this._raf = requestAnimationFrame(this._tickHandler);
        this._onLoad && this._onLoad();
      })
      .then(() => this._animateStart());
  }


  private _animateStart() {
    const tl = gsap.timeline();

    tl.to(this._group.position, {
      z: -1,
      y: -0.03,
      duration: 1.4,
      ease: "power4.out"
    }, 0.1);
    tl.to(this._group.rotation, {
      y: 0,
      duration: 1.6,
      ease: "expo.out"
    }, 0.1);
    tl.to(this._hand.inner, {
      x: 0,
      y: 0,
      opacity: 1,
      ease: "expo.out",
      duration: 1
    }, 1);

    tl.add(() => {
      this._draggable.enable();
    }, 1.5);
  }
  private _animateDragEnd() {
    this._draggable.disable();
    this._top?.removeFromParent();

    const tl = gsap.timeline();

    tl.to(this._group.position, {
      y: -2,
      x: 0.1,
      duration: 1.5,
      ease: "power4.inOut"
    }, 0);
    tl.to(this._group.rotation, {
      z: Math.PI / 4,
      duration: 1.6,
      ease: "expo.inOut"
    }, 0);
    tl.to(this._hand.inner, {
      x: -5,
      y: 50,
      opacity: 0,
      ease: "power4.inOut",
      duration: 1.3
    }, 0);
    tl.to(this._hand.inner, {
      opacity: 0,
      ease: "power4.inOut",
      duration: 1
    }, 0);
  }



  public destroy() {
    this._isDestroyed = true;
    this._draggable.kill();

    this._container.removeChild(this._renderer.domElement);
    this._container.removeChild(this._hand.el);
    cancelAnimationFrame(this._raf);
    // window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('resize', this._onResize);
  }
  public set onLoad(func: EventHandler | undefined) {
    this._onLoad = func;

    if (this._isLoaded && func) func();
  }
  public set onComplete(func: EventHandler | undefined) {
    this._onComplete = func;

    if (this._isComplete && func) func();
  }


  private _createHand() {
    const el = document.createElement('div');
    el.classList.add('card-box-hand');
    const inner = document.createElement('div');
    el.appendChild(inner);
    inner.classList.add('card-box-hand-inner');
    gsap.set(inner, {
      y: 50,
      x: 10,
      opacity: 0
    })
    this._container.appendChild(el);
    return {
      el, inner
    };
  }
  private _createDrag(container: HTMLDivElement) {
    const draggable =  Draggable.create(document.createElement('div'), {
      type: 'x',
      trigger: container,
      inertia: true,
      edgeResistance: 0.8,
      dragResistance: 0,
      // velocity: 10000000,
      resistance: 10000000,
      snap: {
        x: (value) => {
          if (value < this._x * 0.4) {
            return 0;
          } else {
            return this._x;
          }
        }
      },
      onDrag: () => this._onDrag(this._draggable.x),
      onThrowUpdate: () => this._onDrag(this._draggable.x)
    })[0];

    draggable.disable();

    return draggable;
  }
  private _createLights() {
    const ambient = new AmbientLight( 0xFF7373, 0.3);
    const point = new PointLight( 0xD0FFFF, 2.5, 32 , 1.2);
    point.position.set(10, 5, 15);
    const point2 = new PointLight( 0xD0FFFF, 2, 13, 2);
    point2.position.set(6, 0, 10);

    this._scene.add(ambient, point, point2);

    return {ambient, point};
  }

  private async _load() {
    const mLoader = new GLTFLoader();
    const tLoader = new TextureLoader();
    // const rLoader = new RGBELoader();

    const [map, normalMap, model] = await Promise.all([
    // const [bumpMap, map, normalMap, model] = await Promise.all([
      // tLoader.loadAsync('./models/bump.jpg'),
      tLoader.loadAsync('./models/map.jpg'),
      tLoader.loadAsync('./models/normal.jpg'),
      mLoader.loadAsync('./models/model.glb'),
      // rLoader.loadAsync('./models/HDR_1.hdr')
    ]);

    if (this._isDestroyed) return;

    // processTexture(bumpMap);
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
    });

    this._mixer = new AnimationMixer(model.scene);

    this._clip = model.animations[0];
    this._action = this._mixer.clipAction(this._clip).play();
    // this._action.loop = LoopOnce;

    model.scene.scale.setScalar(3.8);

    model.scene.traverse((obj) => {
      if ('isMesh' in obj) {
        const object = obj as Mesh;
        object.material = material;
        if (object.name === 'top') {
          this._top = object;
        }
      }
    })

    this._modelGroup.add(model.scene);
    this._group.add(this._modelGroup);
    this._group.position.y = -0.03;

    this._isLoaded = true;
  }
  private _resize() {
    this._vw = window.innerWidth;
    this._vh = window.innerHeight;
    const heightCoeff = this._vh / 667;

    this._container.style.width = this._vw + 'px';
    this._container.style.height = this._vh + 'px';

    this._renderer.setSize(this._vw, this._vh);

    this._x = 261 * heightCoeff
    this._draggable.applyBounds({
      minX: 0,
      maxX: this._x
    });
    this._pos.y = -heightCoeff * 90;
    this._pos.x = 118 * 2 * heightCoeff;

    this._camera.aspect = this._vw / this._vh;
    this._camera.updateProjectionMatrix();

    this._updateHandPos(0);
  }
  private _tick() {
    this._renderer.render(this._scene, this._camera);

    // if (this._mixer) {
    //   this._mixer.update()
    // }

    this._raf = requestAnimationFrame(this._tickHandler);
  }

  private _onDrag(x: number) {
    const clip = this._clip!;
    const mixer = this._mixer!;
    const action = this._action!;

    let coeff = x / this._x;
    let coeffDur = coeff;
    coeffDur = Math.min(coeffDur, 0.99);
    coeffDur = Math.max(coeffDur, 0);

    mixer.setTime(coeffDur * clip.duration);
    this._modelGroup.rotation.y = coeffDur * (Math.PI / 12);

    let coeffPos = coeff * 2;
    coeffPos = Math.min(coeffPos, 1);
    this._updateHandPos(coeffPos);

    if (coeff >= 1) {
      this._animateDragEnd();
    }
  }
  private _updateHandPos(coeff: number) {
    coeff = coeff - 0.5;
    this._hand.el.style.transform = `translate3d(${this._pos.x * coeff}px, ${this._pos.y}px, 0) rotate(${coeff * 15}deg)`;
  }

  // private _move(e: MouseEvent)  {
  //   const pos = (e.clientX - this._vw / 2) / this._vw;
  //
  //   this._group.rotation.y = Math.PI * pos * 2
  // }
}