import React, { useState } from 'react';
import { Team, Question, GameSettings, AvatarType, Difficulty, AnsweringMode, GraphicsQuality } from '../types/game';
import {
  SCIENCE_HUMAN_BODY_QUESTIONS,
  MATH_PRESET_QUESTIONS,
  INITIAL_TEAMS,
  EXTRA_AVATAR_TEMPLATES,
  DEFAULT_SETTINGS,
  parseBulkQuestions,
} from '../utils/sampleData';
import {
  X,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Upload,
  BookOpen,
  Users,
  Sliders,
  Check,
  AlertCircle,
  Sparkles,
  Wand2,
  Loader2,
  CheckCircle2,
  Layers,
  HelpCircle,
  Globe,
  GraduationCap,
  LogOut,
  Cloud,
} from 'lucide-react';

interface TeacherSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onSaveTeams: (teams: Team[]) => void;
  questions: Question[];
  onSaveQuestions: (questions: Question[]) => void;
  settings: GameSettings;
  onSaveSettings: (settings: GameSettings) => void;
  onStartOrRestartGame: () => void;
  user?: any;
  onLogout?: () => void;
}

export const TeacherSetupModal: React.FC<TeacherSetupModalProps> = ({
  isOpen,
  onClose,
  teams,
  onSaveTeams,
  questions,
  onSaveQuestions,
  settings,
  onSaveSettings,
  onStartOrRestartGame,
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'AI_GENERATE' | 'QUESTIONS' | 'TEAMS' | 'BULK' | 'SETTINGS'>('QUESTIONS');

  // Local draft states
  const [draftTeams, setDraftTeams] = useState<Team[]>(teams);
  const [draftQuestions, setDraftQuestions] = useState<Question[]>(questions);
  const [draftSettings, setDraftSettings] = useState<GameSettings>(settings);

  // Keep draft states synced with saved recent settings when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftTeams(teams);
      setDraftQuestions(questions);
      setDraftSettings(settings);
    }
  }, [isOpen, teams, questions, settings]);

  // Bulk import state
  const [bulkText, setBulkText] = useState<string>(
`QUESTION:
Which organ pumps blood around the entire body?
A: Brain
B: Heart
C: Lung
D: Stomach
ANSWER: B
DIFFICULTY: Easy
MOVEMENT: 1
EXPLANATION: The heart beats continuously to circulate oxygenated blood.

QUESTION:
Which organ is mainly used for breathing?
A: Heart
B: Stomach
C: Lungs
D: Brain
ANSWER: C
DIFFICULTY: Easy
MOVEMENT: 1
EXPLANATION: Our lungs absorb oxygen and exhale carbon dioxide.`
  );
  const [bulkImportSuccess, setBulkImportSuccess] = useState<string | null>(null);

  // Question currently being edited
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});

  // ---------------- AI QUIZ GENERATOR STATE ----------------
  const [aiTopic, setAiTopic] = useState<string>('Human Body & Digestive System');
  const [aiGradeLevel, setAiGradeLevel] = useState<string>('Primary School (Ages 8-12)');
  const [aiLanguage, setAiLanguage] = useState<string>('English');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [aiCount, setAiCount] = useState<number>(6);
  const [aiModel, setAiModel] = useState<string>('AUTO');
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Quick topics for 1-click inspiration
  const quickAiTopics = [
    { label: '🧬 Human Anatomy', topic: 'Human Body, Organs & Digestive System' },
    { label: '🪐 Solar System', topic: 'Solar System, Planets, Stars & Space' },
    { label: '🇲🇾 BM: Tatabahasa', topic: 'Bahasa Melayu: Kata Nama, Kata Kerja & Penjodoh Bilangan', lang: 'Bahasa Melayu' },
    { label: '📐 Fractions & Math', topic: 'Elementary Fractions, Multiplication & Geometry' },
    { label: '🌿 Plants & Photosynthesis', topic: 'Plants, Photosynthesis & Ecosystems' },
    { label: '🌍 World Geography', topic: 'World Continents, Oceans & Capitals' },
    { label: '⚡ Forces & Magnetism', topic: 'Forces, Energy, Electricity & Magnets' },
    { label: '📖 English Grammar', topic: 'English Grammar, Tenses & Vocabulary' },
  ];

  if (!isOpen) return null;

  // ---------------- AI GENERATOR HANDLERS ----------------
  const handleGenerateAiQuestions = async (customTopic?: string, customLang?: string, customModel?: string) => {
    const topicToUse = customTopic || aiTopic;
    const langToUse = customLang || aiLanguage;
    const modelToUse = customModel || aiModel;

    if (!topicToUse.trim()) {
      setAiError('Please enter a topic or subject for the AI to generate questions.');
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);
    setAiSuccessMsg(null);
    setAiModelUsed(null);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topicToUse,
          gradeLevel: aiGradeLevel,
          language: langToUse,
          difficulty: aiDifficulty,
          count: aiCount,
          preferredModel: modelToUse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setAiGeneratedQuestions(data.questions);
        setAiModelUsed(data.modelUsed || 'gemini-3.8-flash');
        setAiSuccessMsg(`Generated ${data.questions.length} questions successfully via ${data.modelUsed || 'Gemini'}!`);
      } else {
        throw new Error('No questions returned from AI generator.');
      }
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setAiError(err.message || 'Failed to generate questions. Gemini service is experiencing high demand. Click "Retry with Flash Lite" below.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddAiQuestionsToDraft = () => {
    if (aiGeneratedQuestions.length === 0) return;
    setDraftQuestions(prev => [...prev, ...aiGeneratedQuestions]);
    setActiveTab('QUESTIONS');
    setAiSuccessMsg(`Added ${aiGeneratedQuestions.length} questions to your quiz!`);
    setTimeout(() => setAiSuccessMsg(null), 3500);
  };

  const handleReplaceDraftWithAiQuestions = () => {
    if (aiGeneratedQuestions.length === 0) return;
    setDraftQuestions(aiGeneratedQuestions);
    setActiveTab('QUESTIONS');
    setAiSuccessMsg(`Replaced active quiz with ${aiGeneratedQuestions.length} new AI questions!`);
    setTimeout(() => setAiSuccessMsg(null), 3500);
  };

  // ---------------- TEAMS ACTIONS ----------------
  const handleAddTeam = () => {
    if (draftTeams.length >= 8) return;
    const templateIndex = (draftTeams.length - INITIAL_TEAMS.length) % EXTRA_AVATAR_TEMPLATES.length;
    const template = EXTRA_AVATAR_TEMPLATES[Math.max(0, templateIndex)];
    const newId = `team-${Date.now()}`;
    const newTeam: Team = {
      id: newId,
      name: `Team ${draftTeams.length + 1}`,
      number: 100 + (draftTeams.length + 1) * 101,
      avatar: template.avatar,
      color: template.color,
      secondaryColor: template.secondaryColor,
      position: 0,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      streak: 0,
    };
    setDraftTeams([...draftTeams, newTeam]);
  };

  const handleRemoveTeam = (id: string) => {
    if (draftTeams.length <= 2) return; // Keep min 2 teams
    setDraftTeams(draftTeams.filter(t => t.id !== id));
  };

  const handleUpdateTeam = (id: string, field: keyof Team, value: string | number) => {
    setDraftTeams(
      draftTeams.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // ---------------- QUESTIONS ACTIONS ----------------
  const handleAddNewQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      question: 'New Question: Enter prompt here',
      options: {
        A: 'Option A',
        B: 'Option B',
        C: 'Option C',
        D: 'Option D',
      },
      correctAnswer: 'A',
      difficulty: 'Easy',
      points: 10,
      movementSteps: 1,
      explanation: 'Educational explanation here.',
    };
    setDraftQuestions([...draftQuestions, newQ]);
    setEditingQuestionId(newQ.id);
    setEditForm(newQ);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setEditForm({ ...q, options: { ...q.options } });
  };

  const handleSaveEdit = () => {
    if (!editingQuestionId) return;
    setDraftQuestions(
      draftQuestions.map(q => (q.id === editingQuestionId ? ({ ...q, ...editForm } as Question) : q))
    );
    setEditingQuestionId(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if (draftQuestions.length <= 1) return;
    setDraftQuestions(draftQuestions.filter(q => q.id !== id));
    if (editingQuestionId === id) setEditingQuestionId(null);
  };

  const handleDuplicateQuestion = (q: Question) => {
    const dup: Question = {
      ...q,
      id: `q-${Date.now()}`,
      question: `${q.question} (Copy)`,
    };
    setDraftQuestions([...draftQuestions, dup]);
  };

  const handleMoveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= draftQuestions.length) return;
    const newArr = [...draftQuestions];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setDraftQuestions(newArr);
  };

  const handleLoadPreset = (presetName: 'SCIENCE' | 'MATH') => {
    if (presetName === 'SCIENCE') {
      setDraftQuestions(SCIENCE_HUMAN_BODY_QUESTIONS);
    } else {
      setDraftQuestions(MATH_PRESET_QUESTIONS);
    }
    setEditingQuestionId(null);
  };

  // ---------------- BULK IMPORT ----------------
  const handleRunBulkImport = () => {
    const parsed = parseBulkQuestions(bulkText);
    if (parsed.length > 0) {
      setDraftQuestions(parsed);
      setBulkImportSuccess(`Successfully imported ${parsed.length} questions!`);
      setTimeout(() => setBulkImportSuccess(null), 3000);
      setActiveTab('QUESTIONS');
    } else {
      alert('Could not parse any questions. Please check the bulk text format.');
    }
  };

  // ---------------- SAVE ALL & APPLY ----------------
  const handleApplyAllAndClose = () => {
    onSaveTeams(draftTeams);
    onSaveQuestions(draftQuestions);
    onSaveSettings(draftSettings);
    onClose();
  };

  const handleStartGame = () => {
    onSaveTeams(draftTeams);
    onSaveQuestions(draftQuestions);
    onSaveSettings(draftSettings);
    onStartOrRestartGame();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Teacher Control Panel</h2>
              <p className="text-xs text-slate-400">Configure teams, AI questions, and game settings</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Teacher'} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    {user.displayName?.[0] || 'T'}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="font-bold text-white text-[11px] leading-none truncate max-w-[140px]">
                    {user.displayName || 'Teacher'}
                  </span>
                  <span className="text-[9px] text-emerald-400 leading-none mt-0.5 flex items-center gap-1 font-semibold">
                    <Cloud className="w-2.5 h-2.5" />
                    Synced
                  </span>
                </div>
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Sign Out of Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 px-6 gap-2 bg-slate-950/40 overflow-x-auto">
          {/* AI Generator Tab */}
          <button
            onClick={() => setActiveTab('AI_GENERATE')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all shrink-0 ${
              activeTab === 'AI_GENERATE'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>AI Quiz Generator ✨</span>
          </button>

          {/* Questions Bank Tab */}
          <button
            onClick={() => setActiveTab('QUESTIONS')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all shrink-0 ${
              activeTab === 'QUESTIONS'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Questions ({draftQuestions.length})</span>
          </button>

          {/* Teams Tab */}
          <button
            onClick={() => setActiveTab('TEAMS')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all shrink-0 ${
              activeTab === 'TEAMS'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams ({draftTeams.length})</span>
          </button>

          {/* Bulk Import Tab */}
          <button
            onClick={() => setActiveTab('BULK')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all shrink-0 ${
              activeTab === 'BULK'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all shrink-0 ${
              activeTab === 'SETTINGS'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Rules & Timer</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 0: AI QUIZ GENERATOR */}
          {activeTab === 'AI_GENERATE' && (
            <div className="space-y-6 animate-fadeIn">
              {/* AI Intro Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                    AI Question & Answer Generator (Powered by Gemini)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Type any lesson topic, subject, or syllabus concept in English, Bahasa Melayu, or other languages.
                    Gemini AI will instantly generate complete classroom quiz questions with 4 multiple-choice options, correct answers, movement steps, and educational explanations!
                  </p>
                </div>
              </div>

              {/* Topic Input & Generation Controls */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Quiz Topic or Syllabus Concept</span>
                    <span className="text-[11px] text-amber-400/80 font-normal">e.g. Photosynthesis, Fractions, BM Tatabahasa, World War 2</span>
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="Enter topic (e.g. Sistem Peredaran Darah Manusia, Planets of Solar System, Fractions)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* 1-Click Inspiration Quick Topics */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 mb-2 block">
                    Quick Inspiration Topics (Click to select & generate):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickAiTopics.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setAiTopic(item.topic);
                          if (item.lang) setAiLanguage(item.lang);
                          handleGenerateAiQuestions(item.topic, item.lang || aiLanguage);
                        }}
                        disabled={isGeneratingAi}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 text-xs font-semibold text-slate-300 hover:text-amber-300 transition-all text-left"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generation Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> Target Grade
                    </label>
                    <select
                      value={aiGradeLevel}
                      onChange={e => setAiGradeLevel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="Primary / Elementary (Ages 7-10)">Lower Primary (Ages 7-10)</option>
                      <option value="Upper Primary (Ages 10-12)">Upper Primary (Ages 10-12)</option>
                      <option value="Lower Secondary (Ages 13-15)">Lower Secondary (Ages 13-15)</option>
                      <option value="Upper Secondary / High School">High School (Ages 16-18)</option>
                      <option value="General Classroom / All Ages">General / All Ages</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> Language
                    </label>
                    <select
                      value={aiLanguage}
                      onChange={e => setAiLanguage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="English">English</option>
                      <option value="Bahasa Melayu">Bahasa Melayu</option>
                      <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                      <option value="Mandarin Chinese">Mandarin (中文)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Spanish">Spanish (Español)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 mb-1">Difficulty</label>
                    <select
                      value={aiDifficulty}
                      onChange={e => setAiDifficulty(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="Mixed">Mixed (Easy, Med, Hard)</option>
                      <option value="Easy">Easy (1 Step Forward)</option>
                      <option value="Medium">Medium (2 Steps)</option>
                      <option value="Hard">Hard (3 Steps)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 mb-1">Count</label>
                    <select
                      value={aiCount}
                      onChange={e => setAiCount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value={4}>4 Questions</option>
                      <option value={6}>6 Questions</option>
                      <option value={8}>8 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={12}>12 Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Engine
                    </label>
                    <select
                      value={aiModel}
                      onChange={e => setAiModel(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-300 font-semibold"
                    >
                      <option value="AUTO">⚡ Auto (All Models Fallback)</option>
                      <option value="gemini-3.1-flash-lite">🍃 Flash Lite (High Demand Safe)</option>
                      <option value="gemini-3.8-flash">🚀 Gemini 3.8 Flash</option>
                      <option value="gemini-flash-latest">🌟 Flash Latest</option>
                    </select>
                  </div>
                </div>

                {/* Generate Button & Error/Status Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 flex flex-col gap-1">
                    {isGeneratingAi && (
                      <span className="flex items-center gap-2 text-amber-400 font-semibold animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating quiz with AI (auto-failover enabled)...
                      </span>
                    )}
                    {aiError && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {aiError}
                        </span>
                        <button
                          onClick={() => handleGenerateAiQuestions(aiTopic, aiLanguage, 'gemini-3.1-flash-lite')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all"
                        >
                          ⚡ Retry with Flash Lite
                        </button>
                      </div>
                    )}
                    {aiSuccessMsg && (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {aiSuccessMsg}
                        {aiModelUsed && (
                          <span className="text-[10px] text-slate-400 ml-1 px-1.5 py-0.5 rounded bg-slate-800">
                            Engine: {aiModelUsed}
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleGenerateAiQuestions()}
                    disabled={isGeneratingAi || !aiTopic.trim()}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>GENERATING...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>GENERATE QUIZ QUESTIONS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Generated Questions Preview & Import Actions */}
              {aiGeneratedQuestions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                        {aiGeneratedQuestions.length} AI Questions Ready
                      </span>
                      <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                        Review below, then add them to your active quiz!
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddAiQuestionsToDraft}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>APPEND TO QUIZ</span>
                      </button>

                      <button
                        onClick={handleReplaceDraftWithAiQuestions}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>REPLACE ACTIVE QUIZ</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Cards List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiGeneratedQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-400">{q.category}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : q.difficulty === 'Medium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {q.difficulty} (+{q.movementSteps} step{q.movementSteps > 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>

                        <p className="text-sm font-bold text-white leading-snug">{q.question}</p>

                        {/* Options A, B, C, D */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                            const isCorrect = q.correctAnswer === optKey;
                            return (
                              <div
                                key={optKey}
                                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                                  isCorrect
                                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-200 font-bold'
                                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center shrink-0 ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {optKey}
                                </span>
                                <span className="truncate">{q.options[optKey]}</span>
                                {isCorrect && <Check className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: QUESTIONS */}
          {activeTab === 'QUESTIONS' && (
            <div className="space-y-4">
              {/* Presets and Add buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Load Preset:</span>
                  <button
                    onClick={() => handleLoadPreset('SCIENCE')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-all"
                  >
                    Science: Human Body (12 Qs)
                  </button>
                  <button
                    onClick={() => handleLoadPreset('MATH')}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold hover:bg-blue-500/30 transition-all"
                  >
                    Math: Elementary (5 Qs)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('AI_GENERATE')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-orange-400 transition-all shadow-md shadow-amber-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>GENERATE WITH AI ✨</span>
                  </button>

                  <button
                    onClick={handleAddNewQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD QUESTION</span>
                  </button>
                </div>
              </div>

              {/* Edit Question Form if one is active */}
              {editingQuestionId && editForm && (
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-cyan-500/50 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-xs font-black uppercase text-cyan-400">
                      Editing Question
                    </span>
                    <button
                      onClick={() => setEditingQuestionId(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Question Text</label>
                    <input
                      type="text"
                      value={editForm.question || ''}
                      onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Options A, B, C, D */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {(['A', 'B', 'C', 'D'] as const).map(optKey => (
                      <div key={optKey} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-xs font-black text-slate-300 flex items-center justify-center shrink-0">
                          {optKey}
                        </span>
                        <input
                          type="text"
                          value={editForm.options?.[optKey] || ''}
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              options: { ...editForm.options!, [optKey]: e.target.value },
                            })
                          }
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                          placeholder={`Option ${optKey}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Metadata: Correct Answer, Movement Steps, Difficulty, Explanation */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400">Correct Answer</label>
                      <select
                        value={editForm.correctAnswer || 'A'}
                        onChange={e => setEditForm({ ...editForm, correctAnswer: e.target.value as any })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold text-emerald-400"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400">Steps Forward</label>
                      <select
                        value={editForm.movementSteps || 1}
                        onChange={e => setEditForm({ ...editForm, movementSteps: Number(e.target.value) })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      >
                        <option value={1}>1 Step</option>
                        <option value={2}>2 Steps</option>
                        <option value={3}>3 Steps (Big Sprint)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400">Difficulty</label>
                      <select
                        value={editForm.difficulty || 'Easy'}
                        onChange={e => setEditForm({ ...editForm, difficulty: e.target.value as any })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      >
                        <option value="Easy">Easy (10 pts)</option>
                        <option value="Medium">Medium (20 pts)</option>
                        <option value="Hard">Hard (30 pts)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400">Category Tag</label>
                      <input
                        type="text"
                        value={editForm.category || ''}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                        placeholder="e.g. Science, BM"
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Educational Explanation (Shown on Reveal)</label>
                    <input
                      type="text"
                      value={editForm.explanation || ''}
                      onChange={e => setEditForm({ ...editForm, explanation: e.target.value })}
                      placeholder="Brief explanation for why this answer is correct..."
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs"
                    >
                      SAVE QUESTION
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-2">
                {draftQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-xs text-cyan-400 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{q.question}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Ans: {q.correctAnswer}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            +{q.movementSteps || 1} Step{(q.movementSteps || 1) > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300">A:</span> {q.options.A} |{' '}
                          <span className="font-semibold text-slate-300">B:</span> {q.options.B} |{' '}
                          <span className="font-semibold text-slate-300">C:</span> {q.options.C} |{' '}
                          <span className="font-semibold text-slate-300">D:</span> {q.options.D}
                        </div>
                      </div>
                    </div>

                    {/* Question Actions */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleMoveQuestion(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(idx, 'DOWN')}
                        disabled={idx === draftQuestions.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateQuestion(q)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditQuestion(q)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={draftQuestions.length <= 1}
                        className="p-1 text-rose-400 hover:text-rose-300 disabled:opacity-30"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TEAMS & AVATARS */}
          {activeTab === 'TEAMS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Customizable Teams ({draftTeams.length}/8)</h3>
                  <p className="text-xs text-slate-400">Configure team names, runner bib numbers, and avatar body styles.</p>
                </div>

                <button
                  onClick={handleAddTeam}
                  disabled={draftTeams.length >= 8}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 disabled:opacity-40 transition-all shadow-md shadow-cyan-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD TEAM</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {draftTeams.map((team, idx) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.number}
                        </div>
                        <input
                          type="text"
                          value={team.name}
                          onChange={e => handleUpdateTeam(team.id, 'name', e.target.value)}
                          className="bg-transparent border-b border-slate-700 px-1 py-0.5 font-bold text-sm text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveTeam(team.id)}
                        disabled={draftTeams.length <= 2}
                        className="p-1.5 text-slate-400 hover:text-rose-400 disabled:opacity-30"
                        title="Remove Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Bib #</label>
                        <input
                          type="number"
                          value={team.number}
                          onChange={e => handleUpdateTeam(team.id, 'number', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Avatar Style</label>
                        <select
                          value={team.avatar}
                          onChange={e => handleUpdateTeam(team.id, 'avatar', e.target.value as AvatarType)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                        >
                          <option value="BOY_CAP">Boy with Cap</option>
                          <option value="GIRL_PONYTAIL">Girl with Ponytail</option>
                          <option value="BOY_HOODIE">Boy in Hoodie</option>
                          <option value="GIRL_HEADBAND">Girl with Headband</option>
                          <option value="SPRINTER">Pro Sprinter</option>
                          <option value="ROBOT">Robo-Runner</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Jersey Color</label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="color"
                            value={team.color}
                            onChange={e => handleUpdateTeam(team.id, 'color', e.target.value)}
                            className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                          />
                          <span className="text-[11px] font-mono text-slate-300">{team.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BULK IMPORT */}
          {activeTab === 'BULK' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Upload className="w-4 h-4" /> Bulk Text Import Instructions
                </div>
                <p>
                  Paste your questions below using standard format. Each question block should contain <code>QUESTION:</code>, <code>A:</code>, <code>B:</code>, <code>C:</code>, <code>D:</code>, <code>ANSWER:</code>, <code>DIFFICULTY:</code>, and <code>MOVEMENT:</code>.
                </p>
              </div>

              {bulkImportSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {bulkImportSuccess}
                </div>
              )}

              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                placeholder="Paste formatted quiz questions here..."
              />

              <div className="flex justify-end">
                <button
                  onClick={handleRunBulkImport}
                  className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition-all"
                >
                  PARSE & IMPORT QUESTIONS
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: RULES & SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Track Length */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <label className="text-xs font-black uppercase text-slate-300">
                    Track Length (Steps to Finish Line)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Shorter tracks (8 steps) make fast 5-minute games; longer tracks (15 steps) make full class tournaments.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    {[8, 10, 12, 15].map(len => (
                      <button
                        key={len}
                        onClick={() => setDraftSettings({ ...draftSettings, trackLength: len })}
                        className={`flex-1 py-2 rounded-xl font-black text-xs border transition-all ${
                          draftSettings.trackLength === len
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {len} Steps
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Timer */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <label className="text-xs font-black uppercase text-slate-300">
                    Answering Timer Countdown
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Number of seconds pupils have to think and lock in answers.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    {[10, 15, 20, 30, 0].map(sec => (
                      <button
                        key={sec}
                        onClick={() => setDraftSettings({ ...draftSettings, timerDuration: sec })}
                        className={`flex-1 py-2 rounded-xl font-black text-xs border transition-all ${
                          draftSettings.timerDuration === sec
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {sec === 0 ? 'No Timer' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Answering Mode */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <label className="text-xs font-black uppercase text-slate-300">
                    Classroom Answering Mode
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Simultaneous allows all teams to answer every question; Turn-Based rotates active team.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setDraftSettings({ ...draftSettings, answeringMode: 'ALL_TEAMS' })}
                      className={`p-2.5 rounded-xl font-bold text-xs border text-left transition-all ${
                        draftSettings.answeringMode === 'ALL_TEAMS'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-black text-white">All Teams Compete</div>
                      <div className="text-[10px] text-slate-400">Every team inputs answers</div>
                    </button>

                    <button
                      onClick={() => setDraftSettings({ ...draftSettings, answeringMode: 'TEACHER_SELECT' })}
                      className={`p-2.5 rounded-xl font-bold text-xs border text-left transition-all ${
                        draftSettings.answeringMode === 'TEACHER_SELECT'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-black text-white">Turn-Based Teams</div>
                      <div className="text-[10px] text-slate-400">One team answers per turn</div>
                    </button>
                  </div>
                </div>

                {/* Graphics Quality */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <label className="text-xs font-black uppercase text-slate-300">
                    3D Graphics Quality
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Adjust performance for older school computers, tablets, or projectors.
                  </p>
                  <select
                    value={draftSettings.graphicsQuality}
                    onChange={e => setDraftSettings({ ...draftSettings, graphicsQuality: e.target.value as GraphicsQuality })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="HIGH">High (Full Shadows, 2x Pixel Ratio)</option>
                    <option value="MEDIUM">Medium (Balanced Shadows & Performance)</option>
                    <option value="LOW">Low (Maximum FPS for older school tablets)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={draftSettings.enableStreakBonus}
                    onChange={e => setDraftSettings({ ...draftSettings, enableStreakBonus: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 w-4 h-4"
                  />
                  <span>Enable Streak Multiplier (+1 bonus on 2 streak, +2 on 3 streak)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={draftSettings.enablePowerCards}
                    onChange={e => setDraftSettings({ ...draftSettings, enablePowerCards: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 w-4 h-4"
                  />
                  <span>Enable Team Power Cards (Double Move, Second Chance)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              setDraftTeams(INITIAL_TEAMS);
              setDraftQuestions(SCIENCE_HUMAN_BODY_QUESTIONS);
              setDraftSettings(DEFAULT_SETTINGS);
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Reset All to Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyAllAndClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200"
            >
              SAVE CHANGES
            </button>

            <button
              onClick={handleStartGame}
              className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              START / RESTART GAME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
