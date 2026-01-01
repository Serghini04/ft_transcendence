import { useState } from 'react';
import TournamentBracket from './TournamentBracket';

interface Tournament {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  visibility: 'public' | 'private';
  host: string;
}

export default function Tournament() {
  const [tournamentName, setTournamentName] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState('8');
  const [visibility, setVisibility] = useState('Public');
  const [showBracket, setShowBracket] = useState(false);
  const [createdTournament, setCreatedTournament] = useState<{
    name: string;
    maxPlayers: number;
  } | null>(null);
  
  // Mock data for available tournaments
  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: '1',
      name: 'Heisenberg Cup',
      currentPlayers: 2,
      maxPlayers: 8,
      visibility: 'public',
      host: 'skarim'
    },
    {
      id: '2',
      name: 'Crystal Clash',
      currentPlayers: 2,
      maxPlayers: 4,
      visibility: 'private',
      host: 'w.white'
    },
    {
      id: '3',
      name: 'The Lab Games',
      currentPlayers: 9,
      maxPlayers: 16,
      visibility: 'public',
      host: 'j.j.Pinkman'
    },
    {
      id: '4',
      name: 'Heisenberg Cup',
      currentPlayers: 2,
      maxPlayers: 8,
      visibility: 'public',
      host: 'skarim'
    },
    {
      id: '5',
      name: 'Blue Sky Challenge',
      currentPlayers: 5,
      maxPlayers: 8,
      visibility: 'public',
      host: 'j.p.wynne'
    },
    {
      id: '6',
      name: 'Los Pollos Tournament',
      currentPlayers: 3,
      maxPlayers: 16,
      visibility: 'private',
      host: 'g.fring'
    },
    // {
    //   id: '7',
    //   name: 'Better Call Saul Cup',
    //   currentPlayers: 7,
    //   maxPlayers: 8,
    //   visibility: 'public',
    //   host: 's.goodman'
    // },
    // {
    //   id: '8',
    //   name: 'Magnets Arena',
    //   currentPlayers: 1,
    //   maxPlayers: 4,
    //   visibility: 'public',
    //   host: 'j.j.Pinkman'
    // }
  ]);

  const handleCreateTournament = () => {
    // Handle tournament creation logic here
    console.log('Creating tournament:', {
      name: tournamentName,
      players: numberOfPlayers,
      visibility: visibility
    });
    
    // Set created tournament and show bracket
    setCreatedTournament({
      name: tournamentName || 'Tournament ' + Date.now(),
      maxPlayers: parseInt(numberOfPlayers)
    });
    setShowBracket(true);
  };

  const handleJoinTournament = (tournamentId: string) => {
    // Handle join tournament logic here
    console.log('Joining tournament:', tournamentId);
  };
  
  const handleCancelTournament = () => {
    setShowBracket(false);
    setCreatedTournament(null);
    setTournamentName('');
  };
  
  const handleEditSettings = () => {
    setShowBracket(false);
  };

  // If bracket view is active, show the bracket
  if (showBracket && createdTournament) {
    return (
      <TournamentBracket
        tournamentName={createdTournament.name}
        maxPlayers={createdTournament.maxPlayers}
        onCancel={handleCancelTournament}
        onEditSettings={handleEditSettings}
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

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Visibility
                </label>
                <div className="relative">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-slate-700/60 to-slate-700/40 border border-cyan-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:from-slate-700/80 focus:to-slate-700/60 cursor-pointer transition-all hover:border-cyan-500/50"
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Join Tournament</h2>
            
            <div className="tournament-scroll space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-colors gap-3 sm:gap-4"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1 text-sm sm:text-base">{tournament.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400">Hosted by {tournament.host}</p>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                    <div className="text-center px-2 sm:px-0">
                      <p className="text-white font-medium text-xs sm:text-sm whitespace-nowrap">
                        {tournament.currentPlayers} / {tournament.maxPlayers} players
                      </p>
                    </div>
                    
                    <span className="px-2 sm:px-3 py-1 text-xs font-medium text-slate-300 bg-slate-600/40 rounded-full">
                      {tournament.visibility}
                    </span>
                    
                    <button
                      onClick={() => handleJoinTournament(tournament.id)}
                      className="px-4 sm:px-5 py-1.5 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}