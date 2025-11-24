import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
    id: number;
    name: string;
    email: string;
  };

interface ErrorState{
    errormsg: string;
    setErrorMsg: (msg: string) => void;
}

interface TokenState{
    token: string;
    setToken: (msg: string) => void;
}

type UserState = {
    user: User;
    setUser: (user: User) => void;
  };


export const UseErrorStore = create<ErrorState>((set) => ({
    errormsg: "",
    setErrorMsg: (msg: string) => set({errormsg: msg}),
}));

export const UseTokenStore = create(     ///////?
    persist<TokenState>(
      (set) => ({
        token: "",
        setToken: (msg) => set({ token: msg }),
      }),
      {
        name: "jwt-token",
      }
    )
  );

export const UseUserStore = create(     ///////?
    persist<UserState>(
      (set) => ({
        user: {
            id: 0,
            name: "",
            email: ""
        },
        setUser: (newUser) => set({ user: newUser }),
      }),
      {
        name: "user-info",
      }
    )
  );




