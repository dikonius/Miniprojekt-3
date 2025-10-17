

interface MessageResponse {
  message: string;
}

interface LoginResponse {
  success?: boolean;
  token?: string;
  user?: { id: string; username: string; accessLevel: string; };
  errors?: { path: string; message: string }[];
  message?: string;
}

interface LoginBody {
  username: string;
  password: string;
}


interface User {
  pk: string;           
  sk: string;           
  username: string;
  password: string;
  accessLevel: string; 
}

interface JwtPayload {
  userId: string;
  exp: number;
  accessLevel?: string;
}

export type { User, LoginBody, LoginResponse, JwtPayload, MessageResponse };
