/* eslint-disable */
import {AdditiveBlending, Mesh, MeshBasicMaterial, PlaneGeometry, Texture} from 'three';

export const getFlash = (map: Texture) => {
  const geometry = new PlaneGeometry();
  const material = new MeshBasicMaterial({
    transparent: true,
    // color: 'red',
    map,
    blending: AdditiveBlending,
    opacity: 0
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.z = -7.1;
  mesh.position.y = 6;
  mesh.scale.setScalar(13);

  return {
    geometry,
    material,
    mesh
  }
}