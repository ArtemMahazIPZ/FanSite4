import { UserRole } from './enums';

export interface UserDto {
  id: string;
  email: string;
  userName: string;
  role: UserRole;
}

export interface RegisterRequest { email: string; password: string; }
export interface LoginRequest { email: string; password: string; }
export interface RefreshRequest { refreshToken: string; }

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}
