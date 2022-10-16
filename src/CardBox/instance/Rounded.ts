/* eslint-disable */
import {ExtrudeGeometry, Shape, ShapeGeometry} from 'three';


export class RoundedCubeGeometry extends ExtrudeGeometry {
  constructor(width: number, height: number, depth: number, radius0: number, radius1: number, smoothness: number) {
    const shape = new Shape();
    const eps = 0.00001;
    const radius = radius0 - eps;

    shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
    shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true);
    shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true);
    shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true);

    super(shape, {
      depth: depth - radius1 * 2,
      bevelEnabled: true,
      bevelSegments: smoothness * 2,
      steps: 1,
      bevelSize: radius,
      bevelThickness: radius1,
      curveSegments: smoothness
    });

    this.center();
  }
}

export class RoundedPlaneGeometry extends ShapeGeometry{
  constructor(width: number, height: number, radius: number, x = (1 - width) / 2, y = 0) {
    // const x = -width / 2;
    // const y = -height / 2;

    const shape = new Shape();
    shape.moveTo( x, y + radius );
    shape.lineTo( x, y + height - radius );
    shape.quadraticCurveTo( x, y + height, x + radius, y + height );
    shape.lineTo( x + width - radius, y + height );
    shape.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
    shape.lineTo( x + width, y + radius );
    shape.quadraticCurveTo( x + width, y, x + width - radius, y );
    shape.lineTo( x + radius, y );
    shape.quadraticCurveTo( x, y, x, y + radius );

    super(shape);
  }
}

// export const transformUV = (mesh: Mesh) => {
//   const box = new Box3().setFromObject(mesh);
//   const size = new Vector3();
//   box.getSize(size);
//   const vec3 = new Vector3(); // temp vector
//   const attPos = mesh.geometry.attributes.position as BufferAttribute;
//   const attUv = mesh.geometry.attributes.uv as BufferAttribute;
//   for (let i = 0; i < attPos.count; i++){
//     vec3.fromBufferAttribute(attPos, i);
//     attUv.setXY(i,
//       (vec3.x - box.min.x) / size.x,
//       (vec3.y - box.min.y) / size.y
//     );
//   }
//   const points = mesh.geometry.get
//
// // turn vectors' values to a typed array
//   const bufferPoints: number[] = [];
//   points.slice().forEach( p => {
//     bufferPoints.push(p.x, p.y, p.z);
//   });
//   const F32A = new Float32Array(bufferPoints);
//   attPos.set(F32A, 0);
// }