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
  onStatusChange?: (newStatus: string) => void;
}

export default function TournamentBracket({ 
  tournamentName, 
  maxPlayers,
  tournamentId,
  onCancel,
  onStatusChange
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
        
        // Notify parent component if status changed
        if (onStatusChange && response.data.tournament.status) {
          onStatusChange(response.data.tournament.status);
        }
        
        console.log('📊 Tournament data:', {
          status: response.data.tournament.status,
          players: participantPlayers.length,
          matches: response.data.matches?.length || 0,
          matchDetails: response.data.matches?.map(m => ({
            round: m.round,
            pos: m.position,
            p1: m.player1_id,
            p2: m.player2_id,
            winner: m.winner_id
          }))
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
      
      // Find user's next unplayed match (any round)
      const currentMatch = matches.find(match => {
        const isUserInMatch = match.player1_id === user.id.toString() || match.player2_id === user.id.toString();
        const isNotCompleted = !match.winner_id;
        const bothPlayersReady = match.player1_id && match.player2_id;
        
        console.log(`🔍 Match check - Round ${match.round}, Pos ${match.position}:`, {
          matchId: match.id,
          player1: match.player1_id,
          player2: match.player2_id,
          winner: match.winner_id,
          isUserInMatch,
          isNotCompleted,
          bothPlayersReady,
          willMatch: isUserInMatch && isNotCompleted && bothPlayersReady
        });
        
        return isUserInMatch && isNotCompleted && bothPlayersReady;
      });

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
        setUserMatch(null);
        setOpponent(null);
      }
    }
  }, [tournamentStatus, matches, players, user.id]);

  // Helper function to get player by ID
  const getPlayerById = (playerId: string | null): Player | undefined => {
    if (!playerId) return undefined;
    return players.find(p => p.id === playerId);
  };

  // Helper function to get match by round and position
  const getMatch = (round: number, position: number) => {
    return matches.find(m => m.round === round && m.position === position);
  };

  // Calculate number of rounds based on max players
  const numberOfRounds = Math.log2(maxPlayers);
  const playersPerSide = maxPlayers / 2;

  // Get Round 1 matches
  let round1Matches = matches.filter(m => m.round === 1).sort((a, b) => a.position - b.position);
  
  // If tournament is waiting and no matches yet, create virtual matches from participants
  if (tournamentStatus === 'waiting' && round1Matches.length === 0 && players.length > 0) {
    // Create virtual Round 1 matches by pairing consecutive participants
    const virtualMatches = [];
    for (let i = 0; i < maxPlayers / 2; i++) {
      virtualMatches.push({
        id: `virtual-${i}`,
        round: 1,
        position: i + 1,
        player1_id: players[i * 2]?.id || null,
        player2_id: players[i * 2 + 1]?.id || null,
        winner_id: null,
        tournament_id: tournamentId
      });
    }
    round1Matches = virtualMatches;
    console.log('🎨 Created virtual matches for waiting phase:', virtualMatches);
  }
  
  // Get Round 2 matches (semifinals for 8-player, finals for 4-player)
  const round2Matches = matches.filter(m => m.round === 2).sort((a, b) => a.position - b.position);
  
  console.log('🎯 Round 2 matches array:', round2Matches.map(m => ({
    id: m.id,
    p1: m.player1_id,
    p2: m.player2_id,
    winner: m.winner_id
  })));
  
  // Get Round 3 match (finals for 8-player)
  const round3Match = matches.find(m => m.round === 3);

  // Determine finalists and champion based on tournament size
  let leftFinalist: Player | undefined;
  let rightFinalist: Player | undefined;
  let champion: Player | undefined;

  if (maxPlayers === 4) {
    // For 4-player: Round 2 is the final
    const finalMatch = round2Matches[0];
    console.log('🏆 4-Player Finals - Round 2 match:', {
      exists: !!finalMatch,
      p1_id: finalMatch?.player1_id,
      p2_id: finalMatch?.player2_id,
      winner_id: finalMatch?.winner_id
    });
    
    if (finalMatch) {
      leftFinalist = getPlayerById(finalMatch.player1_id);
      rightFinalist = getPlayerById(finalMatch.player2_id);
    // } else {
    //   // No final match yet - check if we have any Round 1 winners we can show
    //   const round1Winners = round1Matches
    //     .filter(m => m.winner_id)
    //     .map(m => m.winner_id);
      
    //   console.log('� Round 1 winners so far:', round1Winners);
      
    //   // Show first winner on the left, second on the right (or TBD)
    //   if (round1Winners.length > 0) {
    //     leftFinalist = getPlayerById(round1Winners[0]);
    //   }
    //   if (round1Winners.length > 1) {
    //     rightFinalist = getPlayerById(round1Winners[1]);
    //   }
    }
    
    console.log('�🏆 Finalists found:', {
      left: leftFinalist?.name || 'TBD',
      right: rightFinalist?.name || 'TBD'
    });
    
    if (finalMatch && finalMatch.winner_id) {
      champion = getPlayerById(finalMatch.winner_id);
      console.log('🏆 Champion:', champion?.name || 'NOT FOUND');
    }
  } else if (maxPlayers === 8) {
    // For 8-player: Round 3 is the final
    if (round3Match) {
      leftFinalist = getPlayerById(round3Match.player1_id);
      rightFinalist = getPlayerById(round3Match.player2_id);
      if (round3Match.winner_id) {
        champion = getPlayerById(round3Match.winner_id);
      }
    }
  }

  const renderPlayerSlot = (player?: Player, showPlus: boolean = true, isChampion: boolean = false, showTBD: boolean = false) => {
    return (
      <div className="relative flex justify-center">
        <div className={`${isChampion ? 'bg-teal-600/80 border-2 border-teal-400' : 'bg-slate-600/60'} text-white px-4 py-2 rounded-lg text-sm font-medium text-center w-[110px] h-[40px] flex items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap`}>
          {player ? player.name : showPlus ? '+' : ''}
          {/* {player ? player.name : showPlus ? '+' : showTBD ? 'TBD' : ''} */}
        </div>
      </div>
    );
  };

  // Render a single match for Round 1 with players
  const renderRound1 = (match?: any, direction: 'right' | 'left' = 'right') => {
    const player1 = match ? getPlayerById(match.player1_id) : undefined;
    const player2 = match ? getPlayerById(match.player2_id) : undefined;
    
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
  const renderRound2 = (match?: any, direction: 'right' | 'left' = 'right') => {
    console.log('🎨 Rendering Round 2 match:', {
      match,
      player1_id: match?.player1_id,
      player2_id: match?.player2_id,
      playersArray: players.map(p => ({ id: p.id, name: p.name }))
    });
    const player1 = match ? getPlayerById(match.player1_id) : undefined;
    const player2 = match ? getPlayerById(match.player2_id) : undefined;
    console.log('🎨 Round 2 players found:', {
      player1: player1?.name || 'NOT FOUND',
      player2: player2?.name || 'NOT FOUND'
    });
    
    return (
      <>
        {direction === 'right' && (
          <>
            <div className="flex flex-col justify-center items-center">
              <div className="w-fit flex flex-col items-center gap-38">
                {renderPlayerSlot(player1, false, false, true)}
                {renderPlayerSlot(player2, false, false, true)}
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
                {renderPlayerSlot(player1, false, false, true)}
                {renderPlayerSlot(player2, false, false, true)}
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
        {tournamentStatus === 'in_progress' && !champion && (
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200">
              🎮 Tournament has started! Preparing your match...
            </div>
          </div>
        )}

        {/* Tournament completed message */}
        {(tournamentStatus === 'completed' || champion) && (
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 bg-teal-500/20 border border-teal-500/50 rounded-lg text-teal-200">
              🏆 Tournament Complete! {champion && `Champion: ${champion.name}`}
            </div>
          </div>
        )}

        {/* Bracket Container */}
        <div className={`p-6 sm:p-8 mb-6 overflow-x-auto ${maxPlayers === 4 ? 'mt-16' : ''}`}>
          <div className={`flex w-fit overflow-x-auto ${maxPlayers === 4 ? 'mx-auto' : ''}`}>
            {/* LEFT SIDE - Round 1 */}
            <div className="flex flex-col gap-6">
              {Array.from({ length: playersPerSide / 2 }).map((_, i) => {
                const match = round1Matches[i];
                return (
                  <div key={`left-r1-${i}`}>
                    {renderRound1(match, 'right')}
                  </div>
                );
              })}
            </div>

            {/* LEFT SIDE - Round 2 (if 8 players) */}
            {maxPlayers === 8 && (
              <>
                {renderRound2(round2Matches[0], 'right')}
              </>
            )}

            {/* CENTER - Final */}
            <div className={`flex flex-col justify-center items-center mt-13 `}>
              {/* Finalists side by side */}
              <div className={`flex items-center gap-8 ${maxPlayers === 8 ? 'mt-4' : ''}`}>
                {renderPlayerSlot(leftFinalist, false, false, true)}
                <div className="text-6xl">🏆</div>
                {renderPlayerSlot(rightFinalist, false, false, true)}
              </div>
              {/* Winner below the trophy */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-slate-400 mb-1 mt-3">Champion</div>
                {renderPlayerSlot(champion, false, !!champion, false)}
              </div>
            </div>

            {/* RIGHT SIDE - Round 2 (if 8 players) */}
            {maxPlayers === 8 && (
              <>
                {renderRound2(round2Matches[1], 'left')}
              </>
            )}

            {/* RIGHT SIDE - Round 1 */}
            <div className="flex flex-col gap-6">
              {Array.from({ length: playersPerSide / 2 }).map((_, i) => {
                const matchIndex = (playersPerSide / 2) + i;
                const match = round1Matches[matchIndex];
                return (
                  <div key={`right-r1-${i}`}>
                    {renderRound1(match, 'left')}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Your Match Card - Fixed bottom right position */}
        {tournamentStatus === 'in_progress' && userMatch && !userMatch.winner_id && (
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
                      console.log('Starting tournament match:', userMatch);
                      navigate('/game/tournament-match', { 
                        state: { 
                          tournamentId,
                          matchId: userMatch.id,
                          opponentId: opponent.id,
                          map: 'Classic',
                          powerUps: false,
                          speed: 'Normal'
                        } 
                      });
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
              tournamentStatus === 'completed'
                ? 'bg-slate-700/80 hover:bg-slate-600 border-slate-500/50 hover:border-slate-400/50'
                : tournamentStatus === 'in_progress'
                ? 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/50 hover:border-amber-500/70'
                : creatorId === user.id.toString()
                ? 'bg-rose-600/20 hover:bg-rose-600/30 border-rose-500/50 hover:border-rose-500/70'
                : 'bg-slate-700/80 hover:bg-slate-600 border-slate-500/50 hover:border-slate-400/50'
            }`}
          >
            {tournamentStatus === 'completed' || champion
              ? 'Back to Lobby'
              : tournamentStatus === 'in_progress'
              ? 'Leave Tournament (Forfeit)'
              : creatorId === user.id.toString()
              ? 'Cancel Tournament'
              : 'Leave Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
}
