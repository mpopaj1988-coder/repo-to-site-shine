// Ambient declarations for vite-imagetools WebP transform imports.
// Covers direct asset imports with ?format=webp&quality=80&w=1920&as=url query params.
declare module "*?format=webp&quality=80&w=1920&as=url" {
  const src: string;
  export default src;
}
