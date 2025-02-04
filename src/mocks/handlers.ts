import { http, HttpResponse } from "msw";
import { ResCode } from "../constants/response";

const tokenValue =
  "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyX2lkMiIsIm5pY2tuYW1lIjoibmlja25hbWVfYSIsInByb2ZpbGVVcmwiOiJwcm9maWxlLzExMy5wbmciLCJhdWQiOlsiYXVkX3dlYiIsImF1ZF9tb2JpbGUiXSwiZXhwIjoxNzM5NDI5NDg5LCJpYXQiOjE3MzY4Mzc0ODl9.ssnHkfflDxpi9MQSZkinwjaGYuQkty5MsUjbwcAjfrc";

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

  // 아이디 중복 확인 ( 성공 )
  http.get("/auth/check-id/:userId", () => {
    return HttpResponse.json(ResCode.SUCCESS);
  }),

  // 아이디 중복 확인 ( 실패 )
  // http.get("/auth/check-id/:userId", () => {
  //   return HttpResponse.json(ResCode.DUPLICATED_ID);
  // }),

  // 회원 가입 ( 성공)
  http.post("/auth/signup", () => {
    return HttpResponse.json(ResCode.SUCCESS);
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

  // 로그아웃
  http.post("/auth/logout", () => {
    return HttpResponse.json(
      {
        code: ResCode.SUCCESS.code,
        message: ResCode.SUCCESS.message,
      },
      {
        headers: {
          "content-type": "application/json",
          "Set-Cookie":
            "refreshToken=mock-refresh-token; HttpOnly; Path=/; Max-Age=0;",
        },
      }
    );
  }),

  // 아이디 중복 체크
  http.get("/auth/check-id/test", () => {
    return HttpResponse.json({
      code: 0,
      message: "Success",
    });
  }),
];
