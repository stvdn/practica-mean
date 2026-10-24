export interface PublicUser { email: string; rol: string }
export interface User extends PublicUser { id: string; passwordHash: string }
export interface NewUser { email: string; passwordHash: string; rol: 'alumno' }
export interface Credentials { email: string; password: string }
export interface AuthSession { token: string; user: PublicUser }
