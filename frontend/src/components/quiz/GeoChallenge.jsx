import React, { useState, useEffect, useCallback } from 'react';
import { X, Trophy, MapPin, Globe, Play, CheckCircle2, XCircle, Timer, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { geoCentroid } from 'd3-geo';

// Haversine formula
function getDistance(c1, c2) {
  const R = 6371; // km
  const dLat = (c2[1] - c1[1]) * Math.PI / 180;
  const dLon = (c2[0] - c1[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(c1[1] * Math.PI / 180) * Math.cos(c2[1] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

const TOTAL_QUESTIONS = 10;
const MODES = ['guess_country', 'guess_capital', 'guess_flag', 'locate_country', 'facts'];

export default function GeoChallenge({ 
  isOpen, 
  onClose, 
  countriesData, 
  userJourney,
  setQuizModeType,
  setQuizTargetCountry,
  quizClickedPolygon,
  clearQuizClickedPolygon
}) {
  const [gameState, setGameState] = useState('menu'); // menu, playing, result
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerEnabled, setTimerEnabled] = useState(true);

  // Stop timer and globe highlights when closed
  useEffect(() => {
    if (!isOpen) {
      setQuizModeType(null);
      setQuizTargetCountry(null);
    }
  }, [isOpen, setQuizModeType, setQuizTargetCountry]);

  // Generate Questions
  const generateQuestions = useCallback(() => {
    if (!countriesData || countriesData.length < 20) return [];
    
    const validCountries = countriesData.filter(c => c.properties.name && (c.properties.iso_a2 || c.properties.iso_a3));
    const qs = [];
    
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const mode = MODES[Math.floor(Math.random() * MODES.length)];
      
      // Select 1 correct and 3 wrong options
      const shuffled = [...validCountries].sort(() => 0.5 - Math.random());
      const target = shuffled[0];
      const options = [target, shuffled[1], shuffled[2], shuffled[3]].sort(() => 0.5 - Math.random());
      
      let questionText = "";
      
      if (mode === 'guess_country') questionText = "Which country is highlighted on the globe?";
      if (mode === 'guess_capital') questionText = `What is the capital of ${target.properties.name}?`;
      if (mode === 'guess_flag') questionText = "Which country does this flag belong to?";
      if (mode === 'locate_country') questionText = `Find and click on ${target.properties.name} on the globe.`;
      if (mode === 'facts') questionText = `Which of these countries is in ${target.properties.region || 'this region'}?`;

      qs.push({
        id: i,
        mode,
        target: target.properties,
        targetFeature: target,
        options: options.map(o => o.properties),
        questionText
      });
    }
    return qs;
  }, [countriesData]);

  const startGame = () => {
    const qs = generateQuestions();
    setQuestions(qs);
    setCurrentIndex(0);
    setScore(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setTimeLeft(15);
    setGameState('playing');
    
    // Set initial globe state for Q1
    setupGlobeForQuestion(qs[0]);
  };

  const setupGlobeForQuestion = (q) => {
    if (!q) return;
    if (q.mode === 'guess_country' || q.mode === 'locate_country') {
      setQuizModeType(q.mode);
      setQuizTargetCountry(q.target);
    } else {
      setQuizModeType(null);
      setQuizTargetCountry(null);
    }
    clearQuizClickedPolygon();
  };

  // Timer logic
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && !isAnswered && timerEnabled) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, isAnswered, timerEnabled]);

  const handleTimeUp = () => {
    setIsAnswered(true);
    setSelectedAnswer('timeout');
  };

  // Handle globe clicks for locate mode
  useEffect(() => {
    if (gameState === 'playing' && !isAnswered && quizClickedPolygon) {
      const q = questions[currentIndex];
      if (q && q.mode === 'locate_country') {
        const clickedName = quizClickedPolygon.properties.name;
        
        // Calculate distance
        const targetCentroid = geoCentroid(q.targetFeature);
        const clickedCentroid = geoCentroid(quizClickedPolygon);
        let dist = 9999;
        
        if (!isNaN(targetCentroid[0]) && !isNaN(clickedCentroid[0])) {
          dist = getDistance(targetCentroid, clickedCentroid);
        }

        // Within 500km is a win for big countries/tiny clicks, or exact match
        const isCorrect = clickedName === q.target.name || dist < 500;

        setSelectedAnswer({
          name: clickedName,
          isCorrect,
          distance: dist
        });
        setIsAnswered(true);
        if (isCorrect) setScore(s => s + 1);
      }
    }
  }, [quizClickedPolygon, gameState, isAnswered, currentIndex, questions]);

  const handleAnswerSelect = (option) => {
    if (isAnswered) return;
    const q = questions[currentIndex];
    
    // Safety check: locate mode is handled by globe clicks only
    if (q.mode === 'locate_country') return;

    setSelectedAnswer(option);
    setIsAnswered(true);
    
    let isCorrect = false;
    if (q.mode === 'guess_capital' || q.mode === 'guess_country' || q.mode === 'guess_flag' || q.mode === 'facts') {
      isCorrect = option.name === q.target.name;
    }

    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < TOTAL_QUESTIONS - 1) {
      const nextQ = questions[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setTimeLeft(15);
      setupGlobeForQuestion(nextQ);
    } else {
      setGameState('result');
      setQuizModeType(null);
      setQuizTargetCountry(null);
      if (userJourney?.recordQuizScore) {
        userJourney.recordQuizScore(score, TOTAL_QUESTIONS);
      }
    }
  };

  if (!isOpen) return null;

  const q = questions[currentIndex];
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-x-4 top-24 md:inset-auto md:top-24 md:right-8 z-40 bg-[#0d1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col w-auto md:w-[450px]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Geo Challenge</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col relative min-h-[350px]">
          {/* MENU STATE */}
          {gameState === 'menu' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-center">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 mx-auto flex items-center justify-center shadow-lg mb-4">
                  <Globe size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Test Your Knowledge</h3>
                <p className="text-gray-400 text-sm">10 questions covering flags, capitals, and map locations.</p>
              </div>

              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mb-6">
                <span className="text-sm font-medium text-gray-300">Enable Timer</span>
                <button 
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${timerEnabled ? 'bg-teal-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${timerEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <button 
                onClick={startGame}
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] flex items-center justify-center gap-2"
              >
                <Play size={18} /> Start Quiz
              </button>
            </motion.div>
          )}

          {/* PLAYING STATE */}
          {gameState === 'playing' && q && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
              
              {/* Progress & Score */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Q {currentIndex + 1} / {TOTAL_QUESTIONS}</span>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Score: {score}</span>
              </div>
              
              <div className="h-1.5 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex) / TOTAL_QUESTIONS) * 100}%` }}
                  className="h-full bg-teal-500 rounded-full"
                />
              </div>

              {/* Question Text */}
              <h3 className="text-lg font-bold text-white mb-6 leading-snug">{q.questionText}</h3>

              {/* Visuals based on Mode */}
              {q.mode === 'guess_flag' && (
                <div className="mb-6 flex justify-center">
                  <img src={`https://flagcdn.com/w160/${(q.target.iso_a2 || q.target.iso_a3 || '').toLowerCase()}.png`} alt="Flag" className="h-24 rounded shadow-lg border border-white/20" />
                </div>
              )}

              {q.mode === 'locate_country' && !isAnswered && (
                <div className="flex-1 flex items-center justify-center border border-dashed border-teal-500/50 rounded-2xl bg-teal-500/5 mb-6">
                  <div className="text-center p-4">
                    <MapPin className="text-teal-400 mx-auto mb-2 animate-bounce" size={24} />
                    <p className="text-teal-300 font-medium text-sm">Click on the globe to locate!</p>
                  </div>
                </div>
              )}

              {q.mode === 'guess_country' && (
                 <div className="mb-6 flex justify-center p-3 border border-pink-500/30 bg-pink-500/5 rounded-xl">
                   <p className="text-pink-400 text-sm font-medium flex items-center gap-2"><Globe size={16}/> Look at the highlighted country on the globe.</p>
                 </div>
              )}

              {/* Timer */}
              {timerEnabled && !isAnswered && (
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <Timer size={16} className={timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-gray-400'} />
                  <span className={`font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-gray-300'}`}>00:{timeLeft.toString().padStart(2, '0')}</span>
                </div>
              )}

              {/* Options */}
              {q.mode !== 'locate_country' && (
                <div className="grid grid-cols-1 gap-2 mt-auto">
                  {q.options.map((opt, i) => {
                    const isTarget = opt.name === q.target.name;
                    let btnClass = "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300";
                    
                    if (isAnswered) {
                      if (isTarget) btnClass = "bg-teal-500/20 border-teal-500 text-teal-300"; // Correct answer is always green
                      else if (selectedAnswer && selectedAnswer.name === opt.name) btnClass = "bg-red-500/20 border-red-500 text-red-300"; // User picked wrong
                      else btnClass = "bg-white/5 border-white/5 text-gray-600 opacity-50"; // Others faded
                    }

                    return (
                      <button 
                        key={i}
                        disabled={isAnswered}
                        onClick={() => handleAnswerSelect(opt)}
                        className={`text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${btnClass}`}
                      >
                        <span className="font-medium">{opt.name}</span>
                        {isAnswered && isTarget && <CheckCircle2 size={16} className="text-teal-400" />}
                        {isAnswered && !isTarget && selectedAnswer?.name === opt.name && <XCircle size={16} className="text-red-400" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Locate Result */}
              {q.mode === 'locate_country' && isAnswered && selectedAnswer && (
                <div className={`mt-auto p-4 rounded-xl border ${selectedAnswer.isCorrect ? 'bg-teal-500/20 border-teal-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedAnswer.isCorrect ? <CheckCircle2 className="text-teal-400" /> : <XCircle className="text-red-400" />}
                    <span className={`font-bold ${selectedAnswer.isCorrect ? 'text-teal-300' : 'text-red-300'}`}>
                      {selectedAnswer.isCorrect ? 'Target Found!' : 'Missed!'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    You clicked {selectedAnswer.name}.<br/>
                    {!selectedAnswer.isCorrect && selectedAnswer.distance < 9000 && `You were off by ~${Math.round(selectedAnswer.distance)}km.`}
                  </p>
                </div>
              )}

              {selectedAnswer === 'timeout' && (
                <div className="mt-auto p-3 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center gap-2 text-orange-300 font-medium">
                  <AlertCircle size={16} /> Time's up! The answer was {q.target.name}.
                </div>
              )}

              {/* Next Button */}
              {isAnswered && (
                <button 
                  onClick={handleNext}
                  className="w-full mt-4 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {currentIndex === TOTAL_QUESTIONS - 1 ? 'See Results' : 'Next Question'}
                </button>
              )}
            </motion.div>
          )}

          {/* RESULTS STATE */}
          {gameState === 'result' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full items-center justify-center text-center gap-6 py-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
                <Trophy size={64} className="text-yellow-400 relative z-10" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
                <p className="text-gray-400 text-sm">You answered {score} out of {TOTAL_QUESTIONS} correctly.</p>
              </div>

              <div className="flex items-center justify-center gap-4 w-full">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1">
                  <span className="block text-3xl font-bold text-teal-400 mb-1">{Math.round((score / TOTAL_QUESTIONS) * 100)}%</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Accuracy</span>
                </div>
              </div>

              <div className="w-full mt-auto flex flex-col gap-2">
                <button 
                  onClick={startGame}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] flex items-center justify-center gap-2"
                >
                  <Play size={18} /> Play Again
                </button>
                <button 
                  onClick={onClose}
                  className="w-full bg-transparent border border-white/20 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  Back to Globe
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
