export interface Credentials { email: string; password: string }
export interface AuthUser { email: string; rol: string }
export interface AuthSession { token: string; user: AuthUser }
