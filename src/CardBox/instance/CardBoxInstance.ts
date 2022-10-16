/* eslint-disable */
import {
  AmbientLight, AnimationAction, AnimationClip, AnimationMixer, BackSide,
  Clock, Group, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshPhysicalMaterial,
  PerspectiveCamera, PointLight, Scene, Texture, TextureLoader,
  Vector2, WebGLRenderer
} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {gsap} from 'gsap';
import {Draggable} from 'gsap/Draggable';
import {InertiaPlugin} from './libs/InertiaPlugin';
import {RoundedCubeGeometry, RoundedPlaneGeometry} from './Rounded';

import modelSource from './models/model.glb';
import modelMapSource from './models/map.jpg';
import modelNormalMapSource from './models/normal.jpg';
import cardBackSource from './models/card.jpg';

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

const getRoundedPlane = (width: number, height: number, radius: number, z: number, material: MeshPhongMaterial | MeshBasicMaterial) => {
  const plane = new RoundedPlaneGeometry(width / height, 1, radius / height);
  if (material.map) {
    material.map.repeat.set(height / width, 1);
    material.map.offset.x = -(height / width - 1) / 2;
  }
  const mesh = new Mesh(plane, material);
  mesh.position.set(-height / 2, -height / 2, z);
  mesh.scale.setScalar(height);

  return mesh;
}

export enum State {
  'not-loaded',
  'loaded',
  'start-animation-ended',
  'drag-ended',
  'end-animation-ended'
}
export type EventHandler = (state: State) => void;

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
  private _onStateChange: EventHandler = () => {};

  private readonly _renderer: WebGLRenderer;
  private readonly _scene = new Scene();
  private readonly _globalGroup = new Group();
  private readonly _modelGroupAnimation = new Group();
  private readonly _modelGroupRotation = new Group();
  private readonly _cardGroupAnimation = new Group();
  private readonly _cardGroupRotation = new Group();
  private readonly _camera: PerspectiveCamera;
  // private readonly _clock = new Clock();
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

    this._scene.add(this._globalGroup);
    this._globalGroup.position.z = -10;
    this._globalGroup.position.y = -0.03;
    this._globalGroup.rotation.y = -Math.PI * 3;
    this._globalGroup.add(this._modelGroupAnimation, this._cardGroupAnimation);

    this._camera = new PerspectiveCamera(60, 1, 0.01, 200000);

    this._createLights();

    this._draggable = this._createDrag(container);

    this._resize();
    // window.addEventListener('mousemove', this._onMove);
    window.addEventListener('resize', this._onResize);

    this._load(cover)
      .then(() => {
        if (this._isDestroyed) return;

        this._resize();
        this._raf = requestAnimationFrame(this._tickHandler);
        this._onStateChange(1);
      })
      .then(() => this._animateStart());
  }


  private _animateStart() {
    const tl = gsap.timeline();

    tl.to(this._globalGroup.position, {
      z: -1,
      y: -0.03,
      duration: 2,
      ease: "power4.out"
    }, 0.1);
    tl.to(this._globalGroup.rotation, {
      y: 0,
      duration: 2.2,
      ease: "expo.out"
    }, 0.1);
    tl.to(this._hand.inner, {
      x: 0,
      y: 0,
      opacity: 1,
      ease: "expo.out",
      duration: 1
    }, '-=1');

    tl.add(() => {
      this._draggable.enable();
    }, 1.5);

    tl.add(() => {
      this._onStateChange(2)
    })
  }
  private _animateDragEnd() {
    this._draggable.disable();
    this._top?.removeFromParent();
    this._onStateChange(3);

    const tl = gsap.timeline();

    tl.to(this._modelGroupAnimation.position, {
      y: -2,
      x: 0.1,
      duration: 1.9,
      overwrite: true,
      ease: "power4.inOut"
    }, 0);
    tl.to(this._modelGroupAnimation.rotation, {
      z: Math.PI / 4,
      duration: 2,
      overwrite: true,
      ease: "expo.inOut"
    }, 0);
    tl.to(this._hand.inner, {
      x: -5,
      y: 50,
      overwrite: true,
      ease: "power4.inOut",
      duration: 1.3
    }, 0);
    tl.to(this._hand.inner, {
      opacity: 0,
      duration: 1,
      overwrite: true,
      ease: "power4.inOut"
    }, 0);

    tl.to(this._cardGroupRotation.rotation, {
      z: Math.PI / 36,
      duration: 1,
      delay: 0.2,
      ease: "power4.inOut"
    }, 0);
    tl.to(this._cardGroupRotation.rotation, {
      y: 0,
      duration: 1,
      delay: 0.3,
      ease: "power4.inOut"
    }, 0);


    tl.to(this._cardGroupRotation.rotation, {
      z: 0,
      y: 0,
      duration: 0.7,
      overwrite: true,
      ease: "power4.inOut"
    }, 1);
    tl.to(this._cardGroupAnimation.rotation, {
      y: Math.PI * 2,
      duration: 1,
      overwrite: true,
      ease: "power4.inOut"
    }, 0.7);
    tl.to(this._cardGroupAnimation.scale, {
      x: 1.4,
      y: 1.4,
      z: 1.4,
      duration: 1,
      overwrite: true,
      ease: "power4.inOut"
    }, 0.8);
    tl.to(this._cardGroupAnimation.position, {
      y: 0.1,
      duration: 1,
      overwrite: true,
      ease: "power4.inOut"
    }, 0.8);


    tl.add(() => this._onStateChange(4))
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
  public set onStateChange(func: EventHandler | undefined) {
    this._onStateChange = func || (() => {});

    // if (this._isLoaded && func) func();
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
      dragResistance: 0.5,
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

  private async _load(cover: string) {
    const mLoader = new GLTFLoader();
    const tLoader = new TextureLoader();

    const [map, normalMap, model, cardBackMap, cardFrontMap] = await Promise.all([
      tLoader.loadAsync(modelMapSource),
      tLoader.loadAsync(modelNormalMapSource),
      mLoader.loadAsync(modelSource),
      tLoader.loadAsync(cardBackSource),
      tLoader.loadAsync(cover)
    ]);

    if (this._isDestroyed) return;

    processTexture(map);
    processTexture(normalMap);
    // processTexture(cardBackMap);

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

    this._modelGroupRotation.add(model.scene);
    this._modelGroupAnimation.add(this._modelGroupRotation);


    const w = 212;
    const h = 342;
    const r = 12;
    const d = 5;
    const b = 4;

    const cardGeometry = new RoundedCubeGeometry(w, h, d, r, 0, 4);
    const redMaterial = new MeshPhongMaterial({
      color: '#FF4560'
    });
    const cardMesh = new Mesh(cardGeometry, redMaterial);

    const cardBackMaterial = new MeshPhongMaterial({
      map: cardBackMap,
      side: BackSide
    });
    const cardBackMesh = getRoundedPlane(
      w,
      h,
      r,
      -(d / 2 + 0.1),
      cardBackMaterial
    );

    const cardFrontMaterial = new MeshBasicMaterial({
      color: '#FFF',
      map: cardFrontMap
    });
    const cardFrontMesh = getRoundedPlane(
      w - b * 2,
      h - b * 2,
      r - b / 2,
      d / 2 + 0.1,
      cardFrontMaterial
    );

    this._cardGroupRotation.scale.setScalar(0.00135);
    this._cardGroupRotation.position.z = 0.005;
    this._cardGroupRotation.add(cardMesh, cardBackMesh, cardFrontMesh);
    this._cardGroupAnimation.add(this._cardGroupRotation);
    this._cardGroupAnimation.rotation.y = Math.PI;

    this._isLoaded = true;
  }
  private _resize() {
    this._vw = window.innerWidth;
    this._vh = window.innerHeight;
    const heightCoeff = this._vh / 667;

    this._container.style.width = this._vw + 'px';
    this._container.style.height = this._vh + 'px';

    this._renderer.setSize(this._vw, this._vh);

    this._x = 261 * heightCoeff;
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
    this._modelGroupRotation.rotation.y = coeffDur * (Math.PI / 12);
    this._cardGroupRotation.rotation.y = coeffDur * (Math.PI / 12);

    let coeffPos = coeff * 2;
    coeffPos = Math.min(coeffPos, 1);
    this._updateHandPos(coeffPos);

    if (coeffPos >= 0.99) {
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
  //   this._globalGroup.rotation.y = Math.PI * pos * 2
  // }
}