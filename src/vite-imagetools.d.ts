// Ambient declarations for vite-imagetools WebP transform imports.
// Covers direct asset imports with ?format=webp&quality=85&as=url query params.
declare module "*?format=webp&quality=85&as=url" {
  const src: string;
  export default src;
}
