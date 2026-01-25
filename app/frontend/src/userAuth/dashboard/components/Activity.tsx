import { Gamepad2, Trophy, Volleyball } from "lucide-react";

interface ActivityProps {
    played?: number;
    wins?: number;
    losses?: number;
    ticTacToePlayed?: number;
    ticTacToeWins?: number;
    goals?: number;
}

export default function Activity({played, wins, ticTacToePlayed, ticTacToeWins, goals}: ActivityProps) {
    const ticTacToeMatchesPlayed = ticTacToePlayed;
    const pingPongMatchesPlayed = played;
    const ticTacToeGamesWon = ticTacToeWins;
    const pingPongGamesWon = wins;
    const pingPongGoals = goals ?? 0;
    // console.log("Activity Component Props: XXXXXXXXXXXXXXXXXXXXXXXXX", { played, wins, tictactoeplayed, tictactoewins });
    return (
        <div className="w-full h-50 xl:w-[35vw] xl:min-h-[clamp(20vw,25vw,30vw)] xl:mr-[-4]">
  <div className="rounded-xl xl:rounded-[1vw] p-4 xl:p-[1.5vw] backdrop-blur-md shadow-xl bg-[rgba(68,78,106,0.3)]">
    
    {/* HEADER */}
    <div className="mb-4 xl:mb-[1.2vw]">
      <p className="text-sm xl:text-[0.9vw]">Today's Activity</p>
      <p className="flex gap-2 xl:gap-[0.6vw] text-sm xl:text-[0.9vw]">
        <span className="text-amber-300">PingPong</span>
        <span>/</span>
        <span className="text-primary">TicTacToe</span>
      </p>
    </div>

    {/* STATS GRID */}
    <div className="w-full grid grid-rows-1 gap-3 xl:gap-[1vw]">
      <div className="w-full grid grid-cols-3 gap-2 xl:gap-[0.8vw]">
        
        {/* Matches Played */}
        <div className="p-3 xl:p-[1vw] bg-[#171821] rounded-md xl:rounded-[0.6vw]">
          <Gamepad2 className="mb-2 w-6 h-6 xl:w-[1.8vw] xl:h-[1.8vw]" />
          <p className="text-xs xl:text-[0.9vw]">Matches Played</p>
          <p className="flex gap-1 xl:gap-[0.5vw] text-sm xl:text-[0.9vw]">
            <span className="text-amber-300">{pingPongMatchesPlayed}</span>
            <span>/</span>
            <span className="text-primary">{ticTacToeMatchesPlayed}</span>
          </p>
        </div>

        {/* Games Won */}
        <div className="p-3 xl:p-[1vw] bg-[#171821] rounded-md xl:rounded-[0.6vw]">
          <Trophy className="mb-2 w-6 h-6 xl:w-[1.8vw] xl:h-[1.8vw]" />
          <p className="text-xs xl:text-[0.9vw]">Games Won</p>
          <p className="flex gap-1 xl:gap-[0.5vw] text-sm xl:text-[0.9vw]">
            <span className="text-amber-300">{pingPongGamesWon}</span>
            <span>/</span>
            <span className="text-primary">{ticTacToeGamesWon}</span>
          </p>
        </div>

        {/* PingPong Goals */}
        <div className="p-3 xl:p-[1vw] bg-[#171821] rounded-md xl:rounded-[0.6vw]">
          <Volleyball className="mb-2 w-6 h-6 xl:w-[1.8vw] xl:h-[1.8vw]" />
          <p className="text-xs xl:text-[0.9vw]">PingPong Goals</p>
          <p className="flex gap-1 xl:gap-[0.5vw] text-sm xl:text-[0.9vw]">
            <span className="text-amber-300">{pingPongGoals}</span>
          </p>
        </div>

      </div>
    </div>
  </div>
</div>

    );
}