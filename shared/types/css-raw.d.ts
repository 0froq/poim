// Vite ?raw 导入的类型声明（Vite 8 client.d.ts 未声明 *.css?raw）
declare module '*.css?raw' {
  const src: string
  export default src
}
