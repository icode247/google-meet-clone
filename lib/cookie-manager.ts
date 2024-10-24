import Cookies from "js-cookie";

export const cookieManager = {
  setAuthCookie: (user: any, token: string) => {
    Cookies.set(
      "auth-storage",
      JSON.stringify({
        state: { user, token },
      }),
      {
        expires: 7,
        path: "/",
        sameSite: "strict",
      }
    );
  },

  clearAuthCookie: () => {
    Cookies.remove("auth-storage", { path: "/" });
  },
};