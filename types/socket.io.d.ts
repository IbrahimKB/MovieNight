// Type declarations for socket.io modules
// These are simplified declarations to avoid build errors when modules aren't installed locally

declare module "socket.io-client" {
  export function io(url: string, options?: any): any;
  export type Socket = any;
}

declare module "socket.io" {
  export class Server {
    constructor(server: any, options?: any);
    on(event: string, callback: (...args: any[]) => void): void;
    to(room: string): { emit: (event: string, data: any) => void };
  }
  export type Socket = any;
}
