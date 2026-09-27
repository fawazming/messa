// Re-export the native module. On web, it will be resolved to MessaSmsModule.web.ts
// and on native platforms to MessaSmsModule.ts
export { default } from './src/MessaSmsModule';
export * from './src/MessaSms.types';
