import { Gamepad2, Trophy, Users } from "lucide-react";

interface ActivityProps {
    pingPongMatchesPlayed?: number;
    ticTacToeMatchesPlayed?: number;
    pingPongGamesWon?: number;
    ticTacToeGamesWon?: number;
    challengesSent?: number;
    challengesReceived?: number;
}

export default function Activity({pingPongMatchesPlayed, ticTacToeMatchesPlayed, pingPongGamesWon, ticTacToeGamesWon, challengesSent, challengesReceived}: ActivityProps) {
    ticTacToeMatchesPlayed = 0;
    pingPongMatchesPlayed = 4;
    ticTacToeGamesWon = 2;
    pingPongGamesWon = 3;
    challengesSent = 5;
    challengesReceived = 3;
    return (
        <div className="w-full h-50">
            <div className="rounded-xl p-4 backdrop-blur-md shadow-xl bg-[rgba(68,78,106,0.3)]">
                <div className="mb-4">
                    <p className="text-sm">Today's Activity</p>
                    <p className="flex gap-2 text-sm">
                        <span className="text-amber-300">PingPong</span>
                        <span>/</span>
                        <span className="text-primary">TicTacToe</span>
                    </p>
                </div>

            <div className="w-full grid grid-rows-1 gap-3">
            <div className="w-full grid grid-cols-3 gap-2">
                <div className="p-3 bg-[#171821] rounded-md">
                    <Gamepad2 className="mb-2 w-6 h-6"/>
                    <p className="text-xs">Matches Played</p>
                    <p className="flex gap-1 text-sm">
                        <span className="text-amber-300">{pingPongMatchesPlayed}</span>
                        <span>/</span>
                        <span className="text-primary">{ticTacToeMatchesPlayed}</span>
                    </p>
                    
                </div>
                <div className="p-3 bg-[#171821] rounded-md">
                    <Trophy className="mb-2 w-6 h-6" />
                    <p className="text-xs">Games Won</p>
                    <p className="flex gap-1 text-sm">
                        <span className="text-amber-300">{pingPongGamesWon}</span>
                        <span>/</span>
                        <span className="text-primary">{ticTacToeGamesWon}</span>
                    </p>
                </div>
                <div className="p-3 bg-[#171821] rounded-md">
                    <Users className="mb-2 w-6 h-6" />
                    <p className="text-xs">New Users</p>
                    <p className="flex gap-1 text-xs">
                        <span className="text-white">Challenges Sent/Received</span>
                    </p>
                </div>
            </div>
            </div>
            </div>
            
        </div>
    );
}