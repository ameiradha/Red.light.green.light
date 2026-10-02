import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Team } from '../types/game';
import { Trophy, Award, RotateCcw, Settings, Heart, Users } from 'lucide-react';

interface WinnerModalProps {
  winner: Team | null;
  teams: Team[];
  trackLength: number;
  totalQuestionsAsked: number;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  teams,
  trackLength,
  totalQuestionsAsked,
  onPlayAgain,
  onNewGame,
}) => {
  useEffect(() => {
    if (winner) {
      // Trigger festive celebration confetti
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#A855F7'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [winner]);

  if (!winner) return null;

  // Sort teams by position and score
  const finalRankings = [...teams].sort((a, b) => {
    if (b.position !== a.position) return b.position - a.position;
    return b.score - a.score;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/80 rounded-3xl shadow-2xl p-6 md:p-8 text-white overflow-hidden">
        {/* Top Trophy Banner */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30 animate-bounce">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>

          <span className="text-xs font-black tracking-widest uppercase text-amber-400">
            FINISH LINE REACHED 🏁
          </span>

          <h1
            className="text-3xl md:text-4xl font-black tracking-tight mt-1"
            style={{ color: winner.color }}
          >
            {winner.name} IS THE CHAMPION!
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Participant #{winner.number} successfully crossed the finish line first!
          </p>
        </div>

        {/* Positive Classroom Encouragement Message */}
        <div className="p-3.5 mb-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 text-emerald-200 text-xs md:text-sm">
          <Heart className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold">Fantastic teamwork! </span>
            Every team participated, learned together, and solved challenging questions.
          </div>
        </div>

        {/* Final Class Leaderboard Table */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Final Class Standings</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3 text-center">Distance</th>
                  <th className="py-2.5 px-3 text-center">Correct</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {finalRankings.map((team, idx) => (
                  <tr
                    key={team.id}
                    className={idx === 0 ? 'bg-amber-500/10 font-bold' : ''}
                  >
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-black ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-extrabold">{team.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{team.number}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                      {team.position} / {trackLength} steps
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">
                      {team.correctAnswers} / {totalQuestionsAsked}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-cyan-400 font-mono">
                      {team.score} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onNewGame}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>CHANGE SETUP & QUESTIONS</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN WITH SAME TEAMS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
