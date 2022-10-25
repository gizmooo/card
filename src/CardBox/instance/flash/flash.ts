/* eslint-disable */
import {Mesh, MeshBasicMaterial, PlaneGeometry, Texture} from 'three';

export const getFlash = (map: Texture) => {
  const geometry = new PlaneGeometry();
  const material = new MeshBasicMaterial({
    transparent: true,
    // color: 'red',
    map,
    opacity: 0
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.z = -5;
  mesh.position.y = 3;
  mesh.scale.setScalar(9);

  return {
    geometry,
    material,
    mesh
  }
}