export interface AccessToken {
  userId: string;
  nickname: string;
  profileUrl: string;
  exp: number;
  iat: number;
}

export interface AuthUser {
  userId: string;
  name: string;
  profileUrl: string;
}
