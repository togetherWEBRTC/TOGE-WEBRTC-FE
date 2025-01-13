import { http, HttpResponse } from "msw";
import { ResCode } from "../constants/response";

const tokenValue =
  "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyX2lkIiwibmlja25hbWUiOiJuaWNrbmFtZV9hIiwicHJvZmlsZVVybCI6InByb2ZpbGUvMy5wbmciLCJhdWQiOlsiYXVkX3dlYiIsImF1ZF9tb2JpbGUiXSwiZXhwIjoxNzM2Njk3OTAyLCJpYXQiOjE3MzY2MTE1MDJ9.j2Ez4vwna3yrjGCHnXImrfKvffAq8Po8S9do57W-No0";

export const handlers = [
  // 로그인 성공
  http.post("/auth/login", () => {
    return HttpResponse.json(
      {
        code: ResCode.SUCCESS.code,
        message: ResCode.SUCCESS.message,
        accessToken: tokenValue,
      },
      {
        headers: {
          "content-type": "application/json",
          "Set-Cookie": "refreshToken=mock-refresh-token; HttpOnly; Path=/;",
        },
      }
    );
  }),

  // 로그인 실패
  // http.post("/auth/login", () => {
  //   return HttpResponse.json(
  //     {
  //       code: ResCode.FAILED_LOGIN.code,
  //       message: ResCode.FAILED_LOGIN.message,
  //     },
  //     {
  //       headers: {
  //         "content-type": "application/json",
  //       },
  //     }
  //   );
  // }),

  // 회원 가입
  http.post("/auth/signup", () => {
    return HttpResponse.json({
      code: 0,
      message: "Success",
      accessToken: tokenValue,
    });
  }),
  // 토큰 갱신 ( 성공 )
  http.post("/auth/refresh/token", () => {
    return HttpResponse.json({
      code: 0,
      message: "Success",
      accessToken: tokenValue,
    });
  }),

  // 토큰 갱신 ( 실패 )
  // http.post("/auth/refresh/token", () => {
  //   return HttpResponse.json(
  //     {
  //       code: 1002,
  //       message: "invalid refresh token",
  //     },
  //     {
  //       status: 403,
  //     }
  //   );
  // }),

  // 아이디 중복 체크
  http.get("/auth/check-id/test", () => {
    return HttpResponse.json({
      code: 0,
      message: "Success",
    });
  }),
];
