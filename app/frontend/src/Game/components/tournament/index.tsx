import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import TournamentBracket from './TournamentBracket';
import { UseUserStore } from '../../../userAuth/zustand/useStore';
import * as tournamentAPI from './api';

export default function Tournament() {
  const { user } = UseUserStore();
  const location = useLocation();
  
  const [tournamentName, setTournamentName] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState('8');
  const [showBracket, setShowBracket] = useState(false);
  const [createdTournament, setCreatedTournament] = useState<tournamentAPI.Tournament | null>(null);
  const [tournaments, setTournaments] = useState<tournamentAPI.Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCreatedTournament, setJustCreatedTournament] = useState(false);

  // Check if returning from a tournament match
  useEffect(() => {
    const openTournamentId = (location.state as any)?.openTournamentId;
    console.log('🔍 Checking location.state:', location.state);
    console.log('🔍 openTournamentId:', openTournamentId);
    
    if (openTournamentId) {
      console.log('🏆 Returning to tournament:', openTournamentId);
      
      // Set flag to prevent deletion check during tournament fetch
      setJustCreatedTournament(true);
      
      // Find and open the tournament by fetching it directly (works for completed tournaments too)
      const findAndOpenTournament = async () => {
        try {
          // First try to get the specific tournament bracket (includes completed tournaments)
          const bracketResponse = await tournamentAPI.getTournamentBracket(openTournamentId);
          console.log('🎯 Found tournament from bracket API:', bracketResponse);
          
          if (bracketResponse && bracketResponse.data && bracketResponse.data.tournament) {
            setCreatedTournament(bracketResponse.data.tournament);
            setShowBracket(true);
            console.log('✅ Bracket opened for tournament:', bracketResponse.data.tournament.id);
          } else {
            // Fallback: try getting from tournaments list
            const response = await tournamentAPI.getTournaments();
            console.log('📋 All tournaments:', response.tournaments);
            const tournament = response.tournaments.find(t => t.id === openTournamentId);
            console.log('🎯 Found tournament from list:', tournament);
            
            if (tournament) {
              setCreatedTournament(tournament);
              setShowBracket(true);
              console.log('✅ Bracket opened for tournament:', tournament.id);
            } else {
              console.error('❌ Tournament not found:', openTournamentId);
            }
          }
        } catch (err) {
          console.error('Failed to open tournament:', err);
        }
      };
      findAndOpenTournament();
    }
  }, [location.state]);

  // Wrap fetchTournaments in useCallback to prevent unnecessary re-renders
  const fetchTournaments = useCallback(async (showLoadingSpinner = true) => {
    try {
      console.log('🔄 Fetching tournaments...', { showLoadingSpinner, timestamp: new Date().toISOString() });
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const response = await tournamentAPI.getTournaments();
      console.log('✅ Tournaments fetched:', response.tournaments.length, 'tournaments');
      setTournaments(response.tournaments);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching tournaments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tournaments');
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  }, []); // Empty deps - this function doesn't depend on any props/state

  // Fetch tournaments on component mount and set up polling
  useEffect(() => {
    console.log('🚀 Tournament polling started, showBracket:', showBracket);
    fetchTournaments(true); // Show loading on first fetch

    // Poll for tournament updates every 3 seconds (always - to detect deleted tournaments)
    const pollInterval = setInterval(() => {
      console.log('⏰ Poll tick, showBracket:', showBracket);
      fetchTournaments(false); // Always fetch, but never show loading spinner
    }, 3000);

    // Cleanup interval on unmount
    return () => {
      console.log('🛑 Tournament polling stopped');
      clearInterval(pollInterval);
    };
  }, [showBracket, fetchTournaments]); // Include fetchTournaments in deps

  // Detect if the current tournament was deleted by another user
  useEffect(() => {
    if (showBracket && createdTournament && !justCreatedTournament) {
      // Check if the current tournament still exists in the tournament list
      const tournamentInList = tournaments.find(t => t.id === createdTournament.id);
      
      console.log('🔍 Deletion check:', {
        showBracket,
        createdTournamentId: createdTournament.id,
        justCreatedTournament,
        tournamentExists: !!tournamentInList,
        currentStatus: createdTournament.status,
        listStatus: tournamentInList?.status,
        tournamentsCount: tournaments.length,
        tournamentIds: tournaments.map(t => t.id)
      });
      
      // Don't close the bracket if tournament is in_progress or completed - we want players to see results
      const isInProgressOrCompleted = 
        createdTournament.status === 'in_progress' || 
        createdTournament.status === 'completed' ||
        tournamentInList?.status === 'in_progress' ||
        tournamentInList?.status === 'completed';
      
      if (!tournamentInList && !isInProgressOrCompleted && tournaments.length >= 0) {
        // Tournament was deleted before it started - notify user and return to list
        console.log('🚨 Tournament was deleted by creator');
        setError('This tournament has been cancelled by the creator');
        setShowBracket(false);
        setCreatedTournament(null);
        
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      } else if (tournamentInList && tournamentInList.status === 'completed' && createdTournament.status !== 'completed') {
        // Update tournament status to completed if it changed
        console.log('🏆 Tournament completed! Updating status...');
        setCreatedTournament({ ...createdTournament, status: 'completed' });
      }
    }
  }, [tournaments, showBracket, createdTournament, justCreatedTournament]);

  // Reset the justCreatedTournament flag after a short delay
  useEffect(() => {
    if (justCreatedTournament) {
      const timer = setTimeout(() => {
        console.log('⏰ Resetting justCreatedTournament flag');
        setJustCreatedTournament(false);
      }, 1000); // Wait 1 second before resetting
      
      return () => clearTimeout(timer);
    }
  }, [justCreatedTournament]);

  const handleCreateTournament = async () => {
    console.log('🏆 Creating tournament:', tournamentName, numberOfPlayers);
    if (!tournamentName.trim()) {
      setError('Please enter a tournament name');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await tournamentAPI.createTournament(
        tournamentName.trim(),
        parseInt(numberOfPlayers),
        user.id.toString(),
        user.name || 'Player'
      );

      setCreatedTournament(response.tournament);
      setShowBracket(true);
      
      // Set flag BEFORE fetch to prevent false deletion detection
      setJustCreatedTournament(true);
      
      // Refresh tournament list
      await fetchTournaments();
      
      // Reset form
      setTournamentName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
      console.error('Error creating tournament:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId: string) => {
    try {
      setLoading(true);
      setError(null);

      await tournamentAPI.joinTournament(
        tournamentId,
        user.id.toString(),
        user.name || 'Player'
      );

      // Find the tournament the user just joined
      const joinedTournament = tournaments.find(t => t.id === tournamentId);
      
      if (joinedTournament) {
        // Set the tournament and show the bracket
        setCreatedTournament(joinedTournament);
        setShowBracket(true);
      }
      
      // Refresh tournament list
      await fetchTournaments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join tournament');
      console.error('Error joining tournament:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelTournament = async () => {
    if (!createdTournament) return;

    try {
      setLoading(true);
      setError(null);

      const isCreator = createdTournament.creator_id === user.id.toString();

      // If tournament is completed, just close the bracket (no API calls)
      if (createdTournament.status === 'completed') {
        console.log('🏁 Tournament completed, returning to lobby');
        setShowBracket(false);
        setCreatedTournament(null);
        setTournamentName('');
        await fetchTournaments();
        setLoading(false);
        return;
      }

      // If tournament is in_progress, allow leaving (with forfeit consequence)
      if (createdTournament.status === 'in_progress') {
        console.log('🚪 Leaving active tournament (forfeit if still in competition)');
        await tournamentAPI.leaveTournament(
          createdTournament.id,
          user.id.toString()
        );
        
        setShowBracket(false);
        setCreatedTournament(null);
        setTournamentName('');
        await fetchTournaments();
        setLoading(false);
        return;
      }

      // Tournament is in 'waiting' status - allow cancel/leave
      if (isCreator) {
        // Creator can cancel (delete) tournament only in waiting status
        console.log('🗑️ Canceling tournament (waiting status)');
        await tournamentAPI.deleteTournament(
          createdTournament.id,
          user.id.toString()
        );
      } else {
        // Participant can leave tournament in waiting status
        console.log('👋 Leaving tournament (waiting status)');
        await tournamentAPI.leaveTournament(
          createdTournament.id,
          user.id.toString()
        );
      }

      // Reset state and return to tournament list
      setShowBracket(false);
      setCreatedTournament(null);
      setTournamentName('');
      
      // Refresh tournament list
      await fetchTournaments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel tournament');
      console.error('Error canceling tournament:', err);
    } finally {
      setLoading(false);
    }
  };

  // Callback to update tournament status when bracket detects changes
  const handleTournamentStatusChange = (newStatus: string) => {
    if (createdTournament && createdTournament.status !== newStatus) {
      console.log(`🔄 Tournament status changed: ${createdTournament.status} → ${newStatus}`);
      setCreatedTournament({ ...createdTournament, status: newStatus as 'waiting' | 'in_progress' | 'completed' });
    }
  };

  // If bracket view is active, show the bracket
  if (showBracket && createdTournament) {
    return (
      <TournamentBracket
        tournamentName={createdTournament.name}
        maxPlayers={createdTournament.max_players}
        tournamentId={createdTournament.id}
        onCancel={handleCancelTournament}
        onStatusChange={handleTournamentStatusChange}
      />
    );
  }

  return (
    <div className="tournament-page relative w-full min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto px-4 sm:px-6 md:px-10 pt-8 sm:pt-12 pb-20 flex items-center justify-center">
      {/* Main content grid - centered with max width */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Create Tournament Section */}
          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-600/30 p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Create Tournament</h2>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Tournament Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="Heisenberg Cup"
                  className="w-full px-4 py-3 bg-slate-700/40 border border-slate-600/40 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                {error && error === 'Please enter a tournament name' && (
                  <p className="mt-1 text-xs text-red-400">Please enter a tournament name</p>
                )}
              </div>

              {/* Number of Players */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Number of Players
                </label>
                <div className="relative">
                  <select
                    value={numberOfPlayers}
                    onChange={(e) => setNumberOfPlayers(e.target.value)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-slate-700/60 to-slate-700/40 border border-teal-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:from-slate-700/80 focus:to-slate-700/60 cursor-pointer transition-all hover:border-teal-500/50"
                  >
                    <option value="4">4 Players</option>
                    <option value="8">8 Players</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateTournament}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors mt-2 text-sm sm:text-base"
              >
                Create
              </button>
            </div>
          </div>

          {/* Join Tournament Section */}
          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-600/30 p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Join Tournament</h2>
              {/* <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                <span>Auto-updating</span>
              </div> */}
            </div>
            
            {error && error !== 'Please enter a tournament name' && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="text-slate-400">Loading tournaments...</div>
              </div>
            ) : tournaments.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <div className="text-slate-400">No tournaments available</div>
              </div>
            ) : (
              <div className="tournament-scroll space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1">
                {tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-colors gap-3 sm:gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1 text-sm sm:text-base">{tournament.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400">Hosted by User {tournament.creator_id}</p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                      <div className="text-center px-2 sm:px-0">
                        <p className="text-white font-medium text-xs sm:text-sm whitespace-nowrap">
                          {tournament.current_players} / {tournament.max_players} players
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleJoinTournament(tournament.id)}
                        disabled={loading || tournament.current_players >= tournament.max_players}
                        className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          tournament.current_players >= tournament.max_players
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                      >
                        {tournament.current_players >= tournament.max_players ? 'Full' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}