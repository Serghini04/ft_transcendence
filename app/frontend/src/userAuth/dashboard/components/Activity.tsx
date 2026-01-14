import { Gamepad2, Trophy } from "lucide-react";

interface ActivityProps {
    pingPongMatchesPlayed?: number;
    ticTacToeMatchesPlayed?: number;
    pingPongGamesWon?: number;
    ticTacToeGamesWon?: number;
}

export default function Activity({pingPongMatchesPlayed, ticTacToeMatchesPlayed, pingPongGamesWon, ticTacToeGamesWon}: ActivityProps) {
    ticTacToeMatchesPlayed = 0;
    pingPongMatchesPlayed = 0;
    ticTacToeGamesWon = 0;
    pingPongGamesWon = 0;
    return (
        <div className="w-full max-w-3xl mx-auto p-4 pl-[6rem] md:pl-4">
            <div className="rounded-xl p-5  backdrop-blur-md shadow-xl  bg-[#444E6A]">
                <div className="mb-8">
                    <p>Today's Activity</p>
                    <p className="flex gap-2">
                        <span className="text-amber-300">PingPong</span>
                        <span>/</span>
                        <span className="text-primary">TicTacToe</span>
                    </p>
                </div>

            <div className="w-full max-w-3xl grid grid-rows-1 justify-center gap-13">
            <div className="w-full max-w-3xl flex gap-3">
                <div className="w-[55%] p-4 bg-[#171821] rounded-md">
                    <Gamepad2 className="mb-3 w-8 h-8"/>
                    <p className="text-sm">Matches Played</p>
                    <p className="flex gap-2">
                        <span className="text-amber-300">{pingPongMatchesPlayed}</span>
                        <span>/</span>
                        <span className="text-primary">{ticTacToeMatchesPlayed}</span>
                    </p>
                    
                </div>
                <div className="w-[55%] max-w-3xl p-4 bg-[#171821] rounded-md">
                    <Trophy className="mb-3 w-8 h-8" />
                    <p className="text-sm">Games Won</p>
                    <p className="flex gap-2">
                        <span className="text-amber-300">{pingPongGamesWon}</span>
                        <span>/</span>
                        <span className="text-primary">{ticTacToeGamesWon}</span>
                    </p>
                </div>
            </div>
            <div className="flex justify-center">
                <div className="w-35 h-24 bg-[#171821] rounded-md"></div>
            </div>
            </div>
            </div>
            
        </div>
    );
}