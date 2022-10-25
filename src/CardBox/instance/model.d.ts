declare module '*.glb' {
  const s: string;
  export default s;
}

declare module '*.glsl' {
  const s: string;
  export default s;
}

declare module '*.glsl?raw' {
  const s: string;
  export default s;
}

declare module '!!raw-loader!*' {
  const content: string;
  export default content;
}