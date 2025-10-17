import type { Request, Response } from 'express';
import type { LoginBody, LoginResponse } from '../data/types.js';
export declare const registerUser: (req: Request, res: Response<LoginResponse>) => Promise<Response<LoginResponse, Record<string, any>> | undefined>;
export declare const loginUser: (req: Request<{}, {}, LoginBody>, res: Response<LoginResponse>) => Promise<Response<LoginResponse, Record<string, any>>>;
export declare const getSecret: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authController.d.ts.map