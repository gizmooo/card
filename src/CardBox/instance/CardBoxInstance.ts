/* eslint-disable */
import {
  AmbientLight, AnimationAction, AnimationClip, AnimationMixer, BackSide,
  Group, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshPhysicalMaterial,
  PerspectiveCamera, PlaneGeometry, PointLight, Scene, Texture, TextureLoader,
  Vector2, WebGLRenderer
} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {gsap} from 'gsap';
import {Draggable} from 'gsap/Draggable';
import {InertiaPlugin} from './libs/InertiaPlugin';
import {CustomEase} from 'gsap/CustomEase';
import {generateStars} from './stars/Stars';
import {RoundedCubeGeometry, RoundedPlaneGeometry} from './Rounded';

import modelSource from './models/model.glb';
import modelMapSource from './models/map.jpg';
import modelNormalMapSource from './models/normal.jpg';
import flashSource from './flash/flash.png';
import cardBackSource from './models/card.jpg';
import {getFlash} from './flash/flash';
import {getCard} from './card/card';
import {getModel} from './models/model';

gsap.registerPlugin(Draggable, InertiaPlugin, CustomEase);



export const RESOLUTION = window.devicePixelRatio || 1;

export enum CardInstanceState {
  'not-loaded',
  'loaded',
  'start-animation-ended',
  'drag-ended',
  'end-animation-started',
  'end-animation-ended'
}
export type EventHandler = (state: CardInstanceState) => void;

export class CardBoxInstance {
  private _state = 0;

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
  private readonly _camera: PerspectiveCamera;
  private _model?: ReturnType<typeof getModel>;
  private _card?: ReturnType<typeof getCard>;
  private _flash?: ReturnType<typeof getFlash>;
  private _stars?: ReturnType<typeof generateStars>;
  // private readonly _clock = new Clock();
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
      logarithmicDepthBuffer: true
    });
    this._container.appendChild(this._renderer.domElement);
    this._hand = this._createHand();
    this._renderer.setPixelRatio(RESOLUTION);

    this._scene.add(this._globalGroup);
    this._globalGroup.position.z = -10;
    this._globalGroup.position.y = -0.03;
    this._globalGroup.rotation.y = -Math.PI * 3;

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
        this._changeState(1);
      })
      .then(() => this._animateStart());
  }

  private _changeState(state: CardInstanceState) {
    this._state = state;
    this._onStateChange(state);
  }


  private _animateStart() {
    const tl = gsap.timeline();

    tl.to(this._globalGroup.position, {
      z: -1,
      y: -0.03,
      duration: 2,
      ease: 'power4.out'
    }, 0.1);
    tl.to(this._globalGroup.rotation, {
      y: 0,
      duration: 2.2,
      ease: 'expo.out'
    }, 0.1);

    tl.to(this._hand.inner, {
      x: 0,
      y: 0,
      opacity: 1,
      ease: 'expo.out',
      duration: 1
    }, '-=1');

    tl.add(() => {
      this._draggable.enable();
    }, 1.5);

    tl.add(() => {
      this._changeState(2)
    })
  }
  private _animateDragEnd() {
    if (this._state >= 3) return;
    this._draggable.disable();
    this._model!.top?.removeFromParent();
    this._changeState(3);

    const tl = gsap.timeline();

    tl.to(this._model!.animation.position, {
      y: -2,
      x: 0.1,
      duration: 1.5,
      overwrite: true,
      ease: 'power4.inOut'
    }, 0);
    tl.to(this._model!.animation.rotation, {
      z: Math.PI / 4,
      duration: 2,
      overwrite: true,
      ease: 'expo.inOut'
    }, 0);
    tl.to(this._hand.inner, {
      x: -5,
      y: 50,
      overwrite: true,
      ease: 'power4.inOut',
      duration: 1.3
    }, 0);
    tl.to(this._hand.inner, {
      opacity: 0,
      duration: 1,
      overwrite: true,
      ease: 'power4.inOut'
    }, 0);

    // tl.to(this._card!.rotation.rotation, {
    //   z: Math.PI / 36,
    //   duration: 1,
    //   ease: 'power4.inOut'
    // }, 0.2);
    // tl.to(this._card!.rotation.rotation, {
    //   y: 0,
    //   duration: 1,
    //   ease: 'power4.inOut'
    // }, 0.3);


    tl.to(this._card!.rotation.rotation, {
      z: 0,
      y: 0,
      duration: 1,
      overwrite: true,
      ease: 'power4.inOut'
    }, 0.5);
    tl.to(this._card!.animation.scale, {
      x: 1.4,
      y: 1.4,
      z: 1.4,
      duration: 1,
      overwrite: true,
      ease: "power4.inOut"
    }, 0.4);
    tl.to(this._card!.animation.position, {
      y: 0.1,
      duration: 1,
      overwrite: true,
      ease: "power4.inOut"
    }, 0.4);


    // flash
    tl.to(this._flash!.material, {
      opacity: 1,
      duration: 1,
      ease: "power4.inOut"
    }, 0);
    tl.to(this._flash!.mesh.position, {
      y: 0.5,
      duration: 1.2,
      ease: "power4.inOut"
    }, 0);

    tl.to(this._flash!.material, {
      opacity: 0,
      duration: 1,
      ease: "power4.inOut"
    }, 1.5);
    tl.to(this._flash!.mesh.position, {
      y: -2,
      duration: 1,
      ease: "power4.inOut"
    }, 1.5);



    // stars
    tl.to(this._stars!.material.uniforms.u_position, {
      value: 1.2,
      duration: 3,
      ease: CustomEase.create("custom", "M0,0 C0.116,0.42 0.074,0.778 0.18,0.89 0.273,0.988 0.818,1.001 1,1 ")
    }, 0.5);

    tl.to(this._stars!.material.uniforms.u_opacity, {
      value: 0.4,
      duration: 0.5,
      ease: 'power4.out'
    }, 0.5);
    tl.to(this._stars!.material.uniforms.u_opacity, {
      value: 0,
      duration: 1,
      ease: 'power4.in'
    }, 1.2);


    tl.to(this._card!.animation.rotation, {
      y: Math.PI * 2,
      duration: 1,
      overwrite: true,
      ease: 'power4.out'
    }, 2);

    tl.to(this._card!.animation.scale, {
      x: 3,
      y: 3,
      z: 3,
      duration: 1,
      ease: 'power4.out',
      onStart: () => this._changeState(4)
    }, 3);
    tl.to(this._container, {
      opacity: 0,
      duration: 1,
      ease: 'power4.out',
    }, 3)


    tl.add(() => this._changeState(5));
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
          if (value < this._x * 0.2) {
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

    const [map, normalMap, model, flashMap, cardBackMap, cardFrontMap] = await Promise.all([
      tLoader.loadAsync(modelMapSource),
      tLoader.loadAsync(modelNormalMapSource),
      mLoader.loadAsync(modelSource),
      tLoader.loadAsync(flashSource),
      tLoader.loadAsync(cardBackSource),
      tLoader.loadAsync(cover)
    ]);

    if (this._isDestroyed) return;

    // model
    this._model = getModel(model, map, normalMap);

    // flash
    this._flash = getFlash(flashMap)

    // stars
    this._stars = generateStars();

    // card
    this._card = getCard(cardBackMap, cardFrontMap);

    this._scene.add(this._flash.mesh, this._stars.group);
    this._globalGroup.add(this._model.animation, this._card.animation);

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
    if (this._state >= 3) return;
    const {clip, mixer, action, rotation: modelRotation} = this._model!;
    const {rotation: cardRotation} = this._card!;

    let coeff = x / this._x;
    let coeffDur = coeff;
    coeffDur = Math.min(coeffDur, 0.99);
    coeffDur = Math.max(coeffDur, 0);

    mixer.setTime(coeffDur * clip.duration);
    modelRotation.rotation.y = coeffDur * (Math.PI / 12);
    cardRotation.rotation.y = coeffDur * (Math.PI / 12);

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