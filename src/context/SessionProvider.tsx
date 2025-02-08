import { createContext, useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export interface AccessToken {
  userId: string;
  nickname: string;
  profileUrl: string;
  exp: number;
  iat: number;
}

export interface AuthUser {
  userId: string;
  nickname: string;
  profileUrl: string;
}

type SessionContextType = {
  authUser: AuthUser | undefined;
  setAuthUser: (user: AuthUser | undefined) => void;
};
const SessionContext = createContext<SessionContextType>({
  authUser: undefined,
  setAuthUser: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser>();

  return (
    <SessionContext.Provider value={{ authUser, setAuthUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const { authUser, setAuthUser } = useContext(SessionContext);
  console.log("authUser :", authUser);

  const update = (token?: string) => {
    console.log("in update : ", token);
    if (!token) {
      setAuthUser(undefined);
      return;
    }

    const decoded: AccessToken = jwtDecode(token);
    const userData = {
      userId: decoded.userId,
      nickname: decoded.nickname,
      profileUrl: decoded.profileUrl,
    };
    setAuthUser(userData);
    return;
  };

  useEffect(() => {
    const accessToken = Cookies.get("accessToken");
    if (accessToken) {
      const decoded: AccessToken = jwtDecode(accessToken);

      const currentTime = new Date().getTime();
      const expTime = decoded.exp * 1000;

      // 액세스 토큰 갱신
      const getNewAccessToken = async () => {
        const res = await fetch("/auth/refresh/token", {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          Cookies.set("accessToken", data.accessToken);
        } else {
          // 리프레쉬 토큰 만료
          Cookies.remove("accessToken");
          setAuthUser(undefined);
        }
      };

      if (currentTime > expTime) {
        getNewAccessToken().then(() => {
          setAuthUser(undefined);
        });
        return;
      }

      if (!authUser) {
        const userData = {
          userId: decoded.userId,
          nickname: decoded.nickname,
          profileUrl: decoded.profileUrl,
        };

        setAuthUser(userData);
      }
    }
  }, [authUser, setAuthUser]);

  return { authUser, update };
}
