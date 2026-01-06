import { useState, useEffect } from "react";
import { TicTacAPI, type User } from "./services/api";
import { useOnlineGame } from "./hooks/useOnlineGame";
import TicTacGame from "./TicTacGame";
import { UseUserStore } from "../userAuth/LoginAndSignup/zustand/useStore";

const OnlineTicTac = ({ isSidebarOpen }: { isSidebarOpen?: boolean }) => {

  const { user: authUser } = UseUserStore();
  const [user, setUser] = useState<User | null>(null);

  const usernameToUse = authUser?.name ?? '';

  const {
    currentGame,
    isSearching,
    opponent,
    isConnected,
    findMatch,
    cancelSearch,
    makeMove,
    forfeit,
    resetGame
  } = useOnlineGame(user);

  useEffect(() => {
    if (!authUser || user) return;

    if (!usernameToUse || usernameToUse.trim().length < 3) {
    console.log('Username must be at least 3 characters');
      return;
    }

    handleLogin();
  }, [authUser]);

  const handleLogin = async () => {
    

    try {
      const existsResp = await TicTacAPI.CheckUserExists(usernameToUse);

      let newUser: User | undefined;
      if (existsResp.exists && existsResp.user) {
        newUser = existsResp.user;
      } else {
        const created = await fetch(`/api/users/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameToUse }),
          credentials: 'include'
        });

        if (!created.ok) {
          const text = await created.text();
          throw new Error(`Failed to create user: ${created.status} - ${text}`);
        }

        const body = await created.json();
        newUser = body.user as User;
      }

      if (!newUser) throw new Error('User not returned from API');

      setUser(newUser);
    } catch (err) {
      console.error('Failed to login:', err);
      alert(`Failed to login: ${err instanceof Error ? err.message : 'Unknown error'}. Check console for details.`);
    }
  };


  return <TicTacGame 
    isSidebarOpen={isSidebarOpen}
    mode="online" 
    onlineProps={{
      currentGame,
      opponent,
      user,
      makeMove,
      forfeit,
      findMatch,
      resetGame,
      isSearching,
      cancelSearch,
      isConnected
    }}
  />;
};

export default OnlineTicTac;
