import type { Request, Response } from 'express';
import type { LoginBody, LoginResponse } from '../data/types.js';
export declare const loginUser: (req: Request<{}, {}, LoginBody>, res: Response<LoginResponse>) => Promise<Response<LoginResponse, Record<string, any>> | undefined>;
//# sourceMappingURL=loginController.d.ts.map