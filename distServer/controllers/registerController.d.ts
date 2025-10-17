import type { Request, Response } from 'express';
import type { LoginResponse } from '../data/types.js';
export declare const registerUser: (req: Request, res: Response<LoginResponse>) => Promise<Response<LoginResponse, Record<string, any>> | undefined>;
//# sourceMappingURL=registerController.d.ts.map