import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

type User = {
  id: number;
  name: string;
  email: string;
};

interface ErrorState {
  errormsg: string;
  setErrorMsg: (msg: string) => void;
}

interface TokenState {
  token: string;
  userId: number | null;
  setToken: (token: string) => void;
}

type UserState = {
  user: User;
  setUser: (user: User) => void;
};

// ---------------------- Error Store ----------------------
export const UseErrorStore = create<ErrorState>((set) => ({
  errormsg: "",
  setErrorMsg: (msg) => set({ errormsg: msg }),
}));

// ---------------------- Token Store ----------------------
export const UseTokenStore = create(
  persist<TokenState>(
    (set) => ({
      token: "",
      userId: null,

      setToken: (token: string) => {
        let decodedId: number | null = null;
        console.error("Setting token:", token);

        // ✅ Only decode if token is not empty
        if (token && token.trim() !== "") {
          try {
            const decoded = jwtDecode<{ id: number; name: string; email: string }>(token);
            decodedId = decoded.id;
            console.log("🔓 Token decoded successfully, userId:", decodedId);
          } catch (err) {
            console.error("❌ Invalid JWT token:", err);
          }
        } else {
          console.warn("⚠️ Empty token provided");
        }

        set({ token, userId: decodedId });
      },
    }),
    {
      name: "jwt-token",
    }
  )
);

// ---------------------- User Store ----------------------
export const UseUserStore = create(
  persist<UserState>(
    (set) => ({
      user: {
        id: 0,
        name: "",
        email: "",
      },
      setUser: (newUser) => set({ user: newUser }),
    }),
    {
      name: "user-info",
    }
  )
);