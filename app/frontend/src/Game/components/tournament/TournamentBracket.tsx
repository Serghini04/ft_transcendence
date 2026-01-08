import { useState, useEffect } from 'react';
import * as tournamentAPI from './api';
import { UseUserStore } from '../../../userAuth/zustand/useStore';
import { useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface Match {
  id: string;
  player1?: Player;
  player2?: Player;
  winner?: Player;
  round: number;
  position: number;
}

interface TournamentBracketProps {
  tournamentName: string;
  maxPlayers: number;
  tournamentId: string;
  onCancel: () => void;
}

export default function TournamentBracket({ 
  tournamentName, 
  maxPlayers,
  tournamentId,
  onCancel
}: TournamentBracketProps) {
  const { user } = UseUserStore();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [tournamentStatus, setTournamentStatus] = useState<string>('waiting');
  const [creatorId, setCreatorId] = useState<string>('');
  const [userMatch, setUserMatch] = useState<any | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournament bracket data
  useEffect(() => {
    const fetchBracketData = async () => {
      try {
        setLoading(true);
        const response = await tournamentAPI.getTournamentBracket(tournamentId);
        
        // Convert participants to players
        const participantPlayers: Player[] = response.data.participants.map(p => ({
          id: p.user_id,
          name: p.username,
          avatar: p.avatar
        }));
        
        setPlayers(participantPlayers);
        setMatches(response.data.matches || []);
        setTournamentStatus(response.data.tournament.status);
        setCreatorId(response.data.tournament.creator_id);
        
        console.log('📊 Tournament data:', {
          status: response.data.tournament.status,
          players: participantPlayers.length,
          matches: response.data.matches?.length || 0
        });
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bracket');
        console.error('Error fetching bracket:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBracketData();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchBracketData, 3000);
    
    return () => clearInterval(interval);
  }, [tournamentId]);

  // When tournament starts, find user's first match and opponent
  useEffect(() => {
    console.log('🔍 Checking for match:', {
      tournamentStatus,
      matchesLength: matches.length,
      playersLength: players.length,
      userId: user.id.toString()
    });

    if (tournamentStatus === 'in_progress' && matches.length > 0 && players.length > 0) {
      console.log('📋 All matches:', matches);
      
      // Find user's match in round 1
      const currentMatch = matches.find(match => 
        match.round === 1 && 
        (match.player1_id === user.id.toString() || match.player2_id === user.id.toString()) &&
        !match.winner_id // Match not completed yet
      );

      console.log('🎯 Found user match:', currentMatch);

      if (currentMatch) {
        setUserMatch(currentMatch);
        
        // Find opponent
        const opponentId = currentMatch.player1_id === user.id.toString() 
          ? currentMatch.player2_id 
          : currentMatch.player1_id;
        
        console.log('👤 Looking for opponent ID:', opponentId);
        console.log('👥 All players:', players);
        
        const opponentPlayer = players.find(p => p.id === opponentId);
        console.log('🎮 Found opponent:', opponentPlayer);
        
        if (opponentPlayer) {
          setOpponent(opponentPlayer);
        }
        
        console.log('🎮 Tournament started! Your match:', currentMatch);
      } else {
        console.log('❌ No match found for user');
      }
    }
  }, [tournamentStatus, matches, players, user.id]);

  // Round 1 winners (semifinals qualifiers) - will be updated when matches are played
  const round1Winners = {
    leftMatch1: undefined,
    leftMatch2: undefined,
    rightMatch1: undefined,
    rightMatch2: undefined,
  };

  // Round 2 winners (finalists) - will be updated when matches are played
  const round2Winners = {
    leftFinal: undefined,
    rightFinal: undefined,
  };

  // Tournament winner - will be updated when tournament is complete
  const tournamentWinner = undefined;

  // Calculate number of rounds based on max players
  const numberOfRounds = Math.log2(maxPlayers);
  const playersPerSide = maxPlayers / 2;

  const renderPlayerSlot = (player?: Player, showPlus: boolean = true) => {
    return (
      <div className="relative flex justify-center">
        <div className="bg-slate-600/60 text-white px-4 py-2 rounded-lg text-sm font-medium text-center w-[110px] h-[40px] flex items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap">
          {player ? player.name : showPlus ? '+' : ''}
        </div>
      </div>
    );
  };

  // Render a single match for Round 1 with players
  const renderRound1 = (player1?: Player, player2?: Player, direction: 'right' | 'left' = 'right') => {
    return (
      <div className="flex justify-center items-center">
        {direction === 'left' && (
          <>
            {/* Horizontal line first, then connector on the left */}
            <div className="bg-slate-500/50 h-[2px] w-12"></div>
            <div className="border-2 border-r-0 rounded-l-2xl border-slate-500/50 w-12 h-32"></div>
          </>
        )}
        
        {/* Players container */}
        <div className="w-fit flex flex-col items-center gap-22">
          {renderPlayerSlot(player1, !player1)}
          {renderPlayerSlot(player2, !player2)}
        </div>

        {direction === 'right' && (
          <>
            {/* Connector first, then horizontal line on the right */}
            <div className="border-2 border-l-0 rounded-r-2xl border-slate-500/50 w-12 h-32"></div>
            <div className="bg-slate-500/50 h-[2px] w-12"></div>
          </>
        )}
      </div>
    );
  };

  // Render a single match for Round 2 (Semifinals)
  const renderRound2 = (player1?: Player, player2?: Player, direction: 'right' | 'left' = 'right') => {
    return (
      <>
        {direction === 'right' && (
          <>
            <div className="flex flex-col justify-center items-center">
              <div className="w-fit flex flex-col items-center gap-38">
                {renderPlayerSlot(player1, false)}
                {renderPlayerSlot(player2, false)}
              </div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <div>
                {/* Connector to finals */}
                <div className="flex justify-center items-center">
                  <div className="border-2 border-l-0 rounded-r-2xl border-slate-500/50 w-12 h-48"></div>
                  <div className="bg-slate-500/50 h-[2px] w-12"></div>
                </div>
              </div>
            </div>
          </>
        )}

        {direction === 'left' && (
          <>
            <div className="flex flex-col justify-center items-center">
              <div>
                {/* Connector to finals */}
                <div className="flex justify-center items-center">
                  <div className="bg-slate-500/50 h-[2px] w-12"></div>
                  <div className="border-2 border-r-0 rounded-l-2xl border-slate-500/50 w-12 h-48"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <div className="w-fit flex flex-col items-center gap-38">
                {renderPlayerSlot(player1, false)}
                {renderPlayerSlot(player2, false)}
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  // Split players into left and right sides
  const leftPlayers = players.slice(0, playersPerSide);
  const rightPlayers = players.slice(playersPerSide);

  if (loading) {
    return (
      <div className="tournament-page relative w-full min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="text-slate-400 text-xl">Loading bracket...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-page relative w-full min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-page relative w-full min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto px-4 sm:px-6 md:px-10 pt-8 sm:pt-12 pb-20">
      <div className="w-full max-w-7xl mx-auto">
        {/* Tournament Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 overflow-hidden text-ellipsis whitespace-nowrap px-4">
            {tournamentName || 'Tournament Bracket'}
          </h1>
          <p className="text-slate-400 text-sm">
            {maxPlayers} Players Tournament • {players.length} / {maxPlayers} Joined
          </p>
        </div>

        {/* Waiting for players message */}
        {players.length < maxPlayers && (
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 bg-teal-500/20 border border-teal-500/50 rounded-lg text-teal-200">
              Waiting for {maxPlayers - players.length} more player{maxPlayers - players.length !== 1 ? 's' : ''} to join...
            </div>
          </div>
        )}

        {/* Tournament starting message */}
        {tournamentStatus === 'in_progress' && (
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200">
              🎮 Tournament has started! Preparing your match...
            </div>
          </div>
        )}

        {/* Bracket Container */}
        <div className={`p-6 sm:p-8 mb-6 overflow-x-auto ${maxPlayers === 4 ? 'mt-16' : ''}`}>
          <div className={`flex w-fit overflow-x-auto ${maxPlayers === 4 ? 'mx-auto' : ''}`}>
            {/* LEFT SIDE - Round 1 */}
            <div className="flex flex-col gap-6">
              {Array.from({ length: playersPerSide / 2 }).map((_, i) => (
                <div key={`left-r1-${i}`}>
                  {renderRound1(leftPlayers[i * 2], leftPlayers[i * 2 + 1], 'right')}
                </div>
              ))}
            </div>

            {/* LEFT SIDE - Round 2 (if 8 players) */}
            {maxPlayers === 8 && (
              <>
                {renderRound2(round1Winners.leftMatch1, round1Winners.leftMatch2, 'right')}
              </>
            )}

            {/* CENTER - Final */}
            <div className={`flex flex-col justify-center items-center mt-13 `}>
              {/* Finalists side by side */}
              <div className={`flex items-center gap-8 ${maxPlayers === 8 ? 'mt-4' : ''}`}>
                {renderPlayerSlot(round2Winners.leftFinal, false)}
                <div className="text-6xl">🏆</div>
                {renderPlayerSlot(round2Winners.rightFinal, false)}
              </div>
              {/* Winner below the trophy */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-slate-400 mb-1 mt-3">Champion</div>
                {renderPlayerSlot(tournamentWinner, false)}
              </div>
            </div>

            {/* RIGHT SIDE - Round 2 (if 8 players) */}
            {maxPlayers === 8 && (
              <>
                {renderRound2(round1Winners.rightMatch1, round1Winners.rightMatch2, 'left')}
              </>
            )}

            {/* RIGHT SIDE - Round 1 */}
            <div className="flex flex-col gap-6">
              {Array.from({ length: playersPerSide / 2 }).map((_, i) => (
                <div key={`right-r1-${i}`}>
                  {renderRound1(rightPlayers[i * 2], rightPlayers[i * 2 + 1], 'left')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Your Match Card - Fixed bottom right position */}
        {tournamentStatus === 'in_progress' && userMatch && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-600/40 p-4 shadow-2xl w-80">
              <h3 className="text-base font-semibold text-white mb-3">Your opponent</h3>
              
              {opponent ? (
                /* Opponent is known - Show match card */
                <div className="bg-slate-700/40 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center overflow-hidden">
                      {opponent.avatar ? (
                        <img src={opponent.avatar} alt={opponent.name} className="w-full h-full object-cover" onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }} />
                      ) : null}
                      <span className={`text-sm text-white font-medium ${opponent.avatar ? 'hidden' : ''}`}>
                        {opponent.name?.substring(0, 2).toUpperCase() || 'OP'}
                      </span>
                    </div>
                    <span className="text-white font-medium">{opponent.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      console.log('Starting match:', userMatch);
                      // TODO: Navigate to game with tournament context
                      // navigate(`/game/tournament/${tournamentId}/match/${userMatch.id}`);
                    }}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-medium transition-colors flex items-center gap-2"
                  >
                    ▶
                  </button>
                </div>
              ) : (
                /* Opponent unknown - Show loading state */
                <div className="bg-slate-700/40 rounded-xl p-4 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-slate-600 border-t-teal-500 rounded-full animate-spin"></div>
                    <p className="text-slate-300 text-sm">Waiting for your component.....</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center items-center">
          <button
            onClick={onCancel}
            className={`px-8 py-3 border text-white rounded-full font-medium transition-all text-sm sm:text-base ${
              creatorId === user.id.toString()
                ? 'bg-rose-600/20 hover:bg-rose-600/30 border-rose-500/50 hover:border-rose-500/70'
                : 'bg-slate-700/80 hover:bg-slate-600 border-slate-500/50 hover:border-slate-400/50'
            }`}
          >
            {creatorId === user.id.toString() ? 'Cancel Tournament' : 'Leave Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
}
