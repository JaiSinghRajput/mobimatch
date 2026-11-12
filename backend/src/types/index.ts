import '@fastify/jwt';

export interface UserJwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserJwtPayload;
    user: UserJwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: UserJwtPayload;
    rawBody?: string;
  }
}
