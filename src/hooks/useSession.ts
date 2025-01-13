import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";
import { jwtDecode } from "jwt-decode";

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

const useSession = () => {
  const accessToken = Cookies.get("accessToken");
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<IauthUser>();
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (accessToken) {
      const decoded: IaccessToken = jwtDecode(accessToken);

      const currentTime = new Date().getTime();
      const expTime = decoded.exp * 1000;

      // 토큰 갱신
      const getNewAccessToken = async () => {
        setIsFetching(true);
        const res = await fetch("/auth/refresh/token", {
          method: "POST",
          credentials: "include",
        });
        setIsFetching(false);
        if (res.ok) {
          const data = await res.json();
          Cookies.set("accessToken", data.accessToken);
        } else {
          Cookies.remove("accessToken");
        }
      };

      if (currentTime > expTime) {
        getNewAccessToken();
        return;
      }

      const userData = {
        userId: decoded.userId,
        nickname: decoded.nickname,
        profileUrl: decoded.profileUrl,
      };

      setAuthUser(userData);
    }
  }, [accessToken, navigate]);

  return { authUser, isFetching };
};

export default useSession;
