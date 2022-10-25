varying vec3 v_color;
uniform sampler2D u_texture;

void main() {
  vec2 uv = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y );

  gl_FragColor = vec4( v_color, 1.0 );
  gl_FragColor = gl_FragColor * texture2D(u_texture, uv);
}
