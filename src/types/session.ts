export interface IaccessToken {
  userId: string;
  nickname: string;
  profileUrl: string;
  exp: number;
  iat: number;
}

export interface IauthUser {
  userId: string;
  nickname: string;
  profileUrl: string;
}
