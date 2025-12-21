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

interface SettingsErrorState {
  nameErrorMsg: string;
  currentPasswordErrorMsg: string;
  newPasswordErrorMsg: string;
  confirmPasswordErrorMsg: string;
  setNameErrorMsg: (msg: string) => void;
  setCurrentPasswordErrorMsg: (msg: string) => void;
  setNewPasswordErrorMsg: (msg: string) => void;
  setConfirmPasswordErrorMsg: (msg: string) => void;
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

type BioState = {
  bio: string;
  setBio: (bio: string) => void;
};

type ShowOtpInputState = {
  otpFlag: boolean;
  setOtpFlag: (otpFlag: boolean) => void;
};

type imageDataUrlState = {
  BgImageDataUrl: string;
  profileImageDataUrl: string;
  setProfileImageDataUrl: (pimageDataURL: string) => void;
  setBgImageDataUrl: (imageDataURL: string) => void;
};
type photosFile = {
  profileFile: File;
  bgFile: File;
  setProfileFile: (profileFile: File) => void;
  setBgImageFile: (bgFile: File) => void;
};

type OtpState = {
  otpOriginal: string;
  flag: string;
  setOtpOriginal: (otp: string) => void;
  setFlag: (flag: string) => void;
};

// ---------------------- Error Store ----------------------
export const UseErrorStore = create<ErrorState>((set) => ({
  errormsg: "",
  setErrorMsg: (msg) => set({ errormsg: msg }),
}));

export const UseSettingsErrorStore = create<SettingsErrorState>((set) => ({
  nameErrorMsg: "",
  currentPasswordErrorMsg: "",
  newPasswordErrorMsg: "",
  confirmPasswordErrorMsg: "",
  setNameErrorMsg: (msg) => set({ nameErrorMsg: msg }),
  setCurrentPasswordErrorMsg: (msg) => set({ currentPasswordErrorMsg: msg }),
  setNewPasswordErrorMsg: (msg) => set({ newPasswordErrorMsg: msg }),
  setConfirmPasswordErrorMsg: (msg) => set({ confirmPasswordErrorMsg: msg }),
}));

// ---------------------- Token Store ----------------------
export const UseTokenStore = create(
  persist<TokenState>(
    (set) => ({
      token: "",
      userId: null,

      setToken: (token: string) => {
        let decodedId: number | null = null;

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

export const UseOtpStore = create<OtpState>((set) => ({
  otpOriginal: "",
  flag: "",
  setFlag: (str) => set({ flag: str }),
  setOtpOriginal: (num) => set({ otpOriginal: num }),
}));


export const UseShowOtpInputStore = create<ShowOtpInputState>((set) => ({
  otpFlag: false,
  setOtpFlag: (flag) => set({ otpFlag: flag }),
}));

export const UseimageDataUrlStore = create<imageDataUrlState>((set) => ({
  BgImageDataUrl: "",
  profileImageDataUrl: "",
  setProfileImageDataUrl: (url) => set({ profileImageDataUrl: url }),
  setBgImageDataUrl: (url) => set({ BgImageDataUrl: url }),
}));

export const UsephotosFileStore = create<photosFile>((set) => ({
  profileFile: null,
  bgFile: null,
  setProfileFile: (file) => set({ profileFile: file }),
  setBgImageFile: (file) => set({ bgFile: file }),
}));

export const UseBioStore = create(
  persist<BioState>(
    (set) => ({
      bio: "",
      setBio: (content) => set({ bio: content}),
    }),
    {
      name: "frofile-bio",
    }
  )
);