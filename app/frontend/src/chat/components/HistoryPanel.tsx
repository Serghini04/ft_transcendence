import { CircleX, RotateCcw, Sword, Bell, UserX } from "lucide-react";
import { useChatStore } from "../store/useChatStore";


export default function HistoryPanel({historyPanelId, isHistoryOpen, toggleHistory} : any) {
    const {selectedContact, isNotificationsMuted, toggleNotificationsMute} = useChatStore();
    const matches = [
      { id: 1, userScore: 4, opponentScore: 3 },
      { id: 2, userScore: 3, opponentScore: 2 },
      { id: 3, userScore: 5, opponentScore: 2 },
      { id: 4, userScore: 4, opponentScore: 0 },
    ];

    return (
     <aside
        id={historyPanelId}
        className={`
          fixed md:relative
          top-20 md:top-0 right-0
          h-[calc(100vh-5rem)] md:h-full
          flex flex-col
          bg-[rgba(15,26,36,0.98)] md:bg-transparent
          border-l-2 border-[#27445E]
          text-white
          overflow-y-auto
          transform
          md:transform-none
          transition-transform md:transition-[width] duration-300 ease-in-out
          z-50
          ${isHistoryOpen ? "translate-x-0 w-80 pointer-events-auto" : "translate-x-full md:translate-x-0 w-0 pointer-events-none"}
        `}
      >
        <div className={`${isHistoryOpen ? "px-4 py-6" : "hidden"} flex flex-col relative h-full`}>
          {/* Close Button */}
          <button
            onClick={toggleHistory}
            className="absolute top-4 right-4 !p-2 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors"
          >
            <CircleX size={26} className="text-gray-400 hover:text-white" />
          </button>

          {/* Avatar Section */}
          <div className="flex flex-col mt-16 items-center space-y-3">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-600">
              <img
                src="/user.png"
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{selectedContact?.user.fullName}</h2>
              <h3 className="text-gray-400 text-sm">{selectedContact?.user.username}</h3>
            </div>
          </div>

          {/* Match History */}
          <div className="mt-6 w-full">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h2 className="text-lg font-medium">History</h2>
              <RotateCcw size={18} className="text-gray-400" />
            </div>

            <div className="flex flex-col gap-3 w-full">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex justify-between items-center bg-[#112434] p-3 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/user.png"
                      alt="User"
                      className="w-10 h-10 rounded-full border border-gray-600"
                    />
                    <span className="text-base font-semibold">
                      {match.userScore}
                    </span>
                  </div>

                  <span className="text-gray-400 font-semibold">vs</span>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold">
                      {match.opponentScore}
                    </span>
                    <img
                      src="/enemy.jpeg"
                      alt="Opponent"
                      className="w-10 h-10 rounded-full border border-gray-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3 w-full">
            <button className="flex items-center justify-center gap-2 !bg-[#112434] hover:!bg-[#1A2D42] !border-none rounded-xl py-2.5 text-sm transition-colors">
              <Sword size={16} />
              Launch a challenge
            </button>

            <div className="flex items-center justify-between bg-[#112434] rounded-xl py-3 px-4">
              <div className="flex items-center gap-3">
                <Bell size={16} />
                Mute notifications
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isNotificationsMuted}
                  onChange={toggleNotificationsMute}
                />
                <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-[#1EC49F] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <button className="flex items-center justify-center gap-2 !bg-[#A33B2E] hover:!bg-[#8E3125] !border-none rounded-xl py-2.5 text-sm !transition-colors">
              <UserX size={16} />
              Block
            </button>
          </div>
        </div>
      </aside>
    );
}