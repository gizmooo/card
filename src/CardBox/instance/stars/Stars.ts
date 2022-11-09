/* eslint-disable */
import {AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, Points, ShaderMaterial} from 'three';
import {generateStarTexture} from './texture';
import {RESOLUTION} from '../CardBoxInstance';

const vertexShader = `
attribute float size;
uniform float u_position;

void main() {
  vec3 startPosition = position;
  startPosition.y = startPosition.y - (1.0 - u_position) * 1.5;
  startPosition.x = startPosition.x * u_position;
  vec4 mvPosition = modelViewMatrix * vec4( startPosition, 1.0 );

  gl_PointSize = size * ( 2.0 / -mvPosition.z );

  gl_Position = projectionMatrix * mvPosition;
}
`;
const fragmentShader = `
uniform sampler2D u_texture;
uniform float u_opacity;

void main() {
  vec2 uv = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y );

  gl_FragColor = texture2D( u_texture, uv );
  gl_FragColor.a = gl_FragColor.a * u_opacity;
}
`;


export const generateStars = () => {
  const num = 400;
  const w = 2;
  const h = 2;

  const positions = new Float32Array(num * 3);
  const sizes = new Float32Array(num);

  const rand = () => 0.5 - Math.random();

  for (let i = 0; i < num; i++) {
    const v0 = i * 3;
    const v1 = v0 + 1;
    const v2 = v0 + 2;

    positions[v0] = rand() * w;
    positions[v1] = rand() * h;
    positions[v2] = rand() * (h / 2 - 10);

    sizes[i] = (5 + Math.random() * 10) * RESOLUTION;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('size',     new BufferAttribute(sizes, 1));

  const material = new ShaderMaterial({
    uniforms: {
      u_texture: {
        value: generateStarTexture()
      },
      u_opacity: {
        value: 0
      },
      u_position: {
        value: 0.5
      }
    },
    // fog: true,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // side: DoubleSide,
    blending: AdditiveBlending,
    vertexShader,
    fragmentShader
  });

  const particles = new Points(geometry, material);
  const group = new Group();
  group.add(particles);

  return {
    geometry,
    material,
    particles,
    group
  }
}