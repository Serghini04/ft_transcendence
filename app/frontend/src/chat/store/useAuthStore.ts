import {create} from 'zustand'


export const useAuthStore = create((set) => ({
    authUser: {name: "Ana", id: 123, age:25},
    isLoggedIn: false,
    login: () => {
        console.log("We just logged in");
        set({isLoggenIn:true})
    }
}))