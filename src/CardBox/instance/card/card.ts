/* eslint-disable */
import {RoundedCubeGeometry, RoundedPlaneGeometry} from '../Rounded';
import {BackSide, Group, Mesh, MeshBasicMaterial, MeshPhongMaterial, Texture} from 'three';


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

export const getCard = (backMap: Texture, frontMap: Texture) => {
  const w = 212;
  const h = 342;
  const r = 12;
  const d = 5;
  const b = 4;

  const geometry = new RoundedCubeGeometry(w, h, d, r, 0, 4);
  const material = new MeshPhongMaterial({
    color: '#FF4560'
  });
  const mesh = new Mesh(geometry, material);

  const backMaterial = new MeshPhongMaterial({
    map: backMap,
    side: BackSide
  });
  const backMesh = getRoundedPlane(
    w,
    h,
    r,
    -(d / 2 + 0.1),
    backMaterial
  );

  const frontMaterial = new MeshBasicMaterial({
    color: '#FFF',
    map: frontMap
  });
  const frontMesh = getRoundedPlane(
    w - b * 2,
    h - b * 2,
    r - b / 2,
    d / 2 + 0.1,
    frontMaterial
  );

  const animation = new Group();
  const rotation = new Group();

  rotation.scale.setScalar(0.00135);
  rotation.position.z = 0.005;
  rotation.add(mesh, backMesh, frontMesh);
  animation.add(rotation);
  animation.rotation.y = Math.PI;

  return {
    geometry,
    material,
    mesh,
    backMaterial,
    backMesh,
    frontMaterial,
    frontMesh,
    animation,
    rotation
  }
}