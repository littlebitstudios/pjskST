import React, { useState, useEffect, useMemo } from 'react';
import { Music, Gauge, Star, Trophy, AlertTriangle, CheckCircle, Trash, Download, Upload, Check } from 'lucide-react';
import "./App.css"

// --- CONFIGURATION AND UTILITIES ---

function calculateTechScore(perfect, great, good, bad, miss) {
  const maxTechScore = 1010000;
  const totalNotes = perfect + great + good + bad + miss;

  if (totalNotes === 0) return 0;

  const scorePerNote = maxTechScore / totalNotes;
  let techScore = maxTechScore;

  techScore -= (scorePerNote * 0.25) * great;
  techScore -= (scorePerNote * 0.50) * good;
  techScore -= (scorePerNote * 0.75) * bad;
  techScore -= scorePerNote * miss;

  return Math.floor(techScore);
}

function calculateExScore(perfect, great, good, bad, miss) {
  let exScore = 0;
  exScore += 3 * perfect;
  exScore += 2 * great;
  exScore += 1 * good;
  return exScore;
}

/**
 * Calculates the base rating value for a single score.
 * Formula: BaseValue = Level * 10 * (TechnicalScore / MaxScore)
 */
function calculateRatingValue(level, technicalScore) {
  const maxTechScore = 1010000;

  // Score normalization (0 to 1)
  const R = technicalScore / maxTechScore;

  // Base Value calculation (Scaled by 10 to provide larger numbers)
  const baseValue = level * R;

  return baseValue;
}

/**
 * Calculates the overall Player Rating by summing the Base Rating Values 
 * of the top 10 highest-rated non-failed scores.
 */
function calculatePlayerRating(scores) {
  if (!scores || scores.length === 0) return 0;

  // 1. Filter out failed scores
  const nonFailedScores = scores.filter(score => !score.failure);

  // 2. Sort by baseRatingValue descending
  // Use the optional chaining on baseRatingValue for safety during imports
  const sortedScores = nonFailedScores.sort((a, b) => (b.baseRatingValue || 0) - (a.baseRatingValue || 0));

  // 3. Take the top 10 scores
  const top10Scores = sortedScores.slice(0, 10);

  // 4. Sum the top 10 baseRatingValues
  const totalRating = top10Scores.reduce((sum, score) => sum + (score.baseRatingValue || 0), 0);

  return parseFloat(totalRating.toFixed(2) / 10);
}


/**
 * ScoreBox Component: Displays a single score entry in a structured, styled card.
 * @param {object} props
 * @param {object} props.score - The score object to display.
 * @param {function} props.onDelete - Function to call when the delete button is clicked.
 */
const ScoreBox = ({ score, onDelete }) => {
  const getClearStatus = (type) => {
    switch (type) {
      case 'allperfect':
        return {
          text: 'All Perfect!',
          color: 'bg-yellow-400 text-gray-900',
          icon: <CheckCircle className="w-5 h-5" />
        };
      case 'fullcombo':
        return {
          text: 'Full Combo',
          color: 'bg-green-500 text-white',
          icon: <Trophy className="w-5 h-5" />
        };
      case 'failed':
        return {
          text: 'Failed',
          color: 'bg-red-600 text-white',
          icon: <AlertTriangle className="w-5 h-5" />
        };
      default:
        return {
          text: 'Clear',
          color: 'bg-gray-500 text-white',
          icon: <Check className="w-5 h-5" />
        };
    }
  };

  // Helper function to determine the color of the difficulty badge
  const getDifficultyColor = (difficulty) => {
    const diff = difficulty?.toLowerCase() || 'normal';
    switch (diff) {
      case 'easy':
        return 'bg-green-400 text-green-900'; // Light Green
      case 'normal':
        return 'bg-blue-400 text-blue-900';   // Light Blue
      case 'hard':
        return 'bg-yellow-400 text-yellow-900'; // Yellow
      case 'expert':
        return 'bg-fuchsia-500 text-white';    // Magenta
      case 'master':
        return 'bg-purple-800 text-purple-100'; // Deep Purple
      case 'append':
        return 'bg-pink-300 text-pink-900';     // Light Pink / Peach
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  const status = getClearStatus(score.specialClearType);
  const difficultyColorClass = getDifficultyColor(score.songDifficulty);

  return (
    <div className="bg-gray-800 border-b-4 border-indigo-600 p-4 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 transform hover:scale-[1.01] relative">

      {/* Delete Button - positioned absolutely */}
      <button
        onClick={onDelete}
        className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition-colors p-1 rounded-full bg-gray-700/50 hover:bg-gray-700"
        aria-label="Delete Score"
      >
        <Trash className="w-5 h-5" />
      </button>

      {/* Header: Song Name and Difficulty */}
      <div className="flex justify-between items-start mb-2 border-b border-gray-600 pb-2 pr-10">
        <div className="flex items-center space-x-2">
          <Music className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-extrabold text-white break-words">{score.songName || "Untitled Score"}</h3>
        </div>

        {/* Updated Difficulty Badge */}
        <div className={`text-sm font-bold px-3 py-1 rounded-full uppercase shadow-sm ${difficultyColorClass}`}>
          {score.songDifficulty} <span className="opacity-75">|</span> Lvl {score.songLevel}
        </div>
      </div>

      {/* Clear Status Badge */}
      <div className={`flex items-center justify-center p-2 mb-4 rounded-lg font-bold ${status.color}`}>
        {status.icon}
        <span className="ml-2">{status.text}</span>
      </div>

      {/* Score Details Grid */}
      <div className="grid grid-cols-2 gap-4 text-center">
        {/* Technical Score */}
        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs font-medium text-gray-400 flex items-center justify-center">
            <Gauge className="w-4 h-4 mr-1 text-red-500" /> TECHNICAL SCORE
          </p>
          <p className="text-2xl font-black text-red-400 mt-1">
            {score.technicalScore.toLocaleString()}
          </p>
        </div>

        {/* EX Score */}
        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs font-medium text-gray-400 flex items-center justify-center">
            <Star className="w-4 h-4 mr-1 text-amber-500" /> EX SCORE
          </p>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {score.exScore.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Hit Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
        <p>Hits: PF:{score.perfectHits} | GT:{score.greatHits} | GD:{score.goodHits} | B:{score.badHits} | M:{score.missedHits}</p>
      </div>

    </div>
  );
};


// --- Message Display Component (Custom modal to replace alert/confirm) ---
const MessageDisplay = ({ message, onClose }) => {
  if (!message) return null;

  const baseClass = "p-3 rounded-lg text-sm font-medium flex justify-between items-center fixed bottom-4 left-1/2 transform -translate-x-1/2 shadow-lg z-50 transition-opacity duration-300";
  const colorClass = message.type === 'error'
    ? 'bg-red-600 text-white'
    : 'bg-green-600 text-white';

  return (
    <div className={`${baseClass} ${colorClass}`}>
      <span>{message.text}</span>
      <button onClick={onClose} className="ml-4 font-bold text-lg leading-none opacity-80 hover:opacity-100">
        &times;
      </button>
    </div>
  );
};


/**
 * Main Application Component
 */
function App() {
  const [message, setMessage] = useState(null); // State for feedback messages

  // 1. Load scores from localStorage on initial render
  const [scores, setScores] = useState(() => {
    try {
      const storedScores = localStorage.getItem('psekaiScores');
      // If data is found, parse it; otherwise, start with an empty array.
      return storedScores ? JSON.parse(storedScores) : [];
    } catch (e) {
      console.error("Could not load scores from localStorage:", e);
      return [];
    }
  });

  // 2. Save scores to localStorage whenever scores state changes
  useEffect(() => {
    try {
      localStorage.setItem('psekaiScores', JSON.stringify(scores));
    } catch (e) {
      console.error("Could not save scores to localStorage:", e);
    }
  }, [scores]);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // New function to delete a score by its index in the array
  const deleteScore = (indexToDelete) => {
    setScores(prevScores => prevScores.filter((_, index) => index !== indexToDelete));
  };

  // Calculate the player rating based on current scores
  const playerRating = useMemo(() => {
    return calculatePlayerRating(scores);
  }, [scores]);


  function saveScore(formData) {
    var score = {
      "songName": "",
      "songDifficulty": "",
      "songLevel": "",
      "specialClearType": "",
      "perfectHits": 0,
      "greatHits": 0,
      "goodHits": 0,
      "badHits": 0,
      "missedHits": 0,
      "technicalScore": 0,
      "exScore": 0,
      "failure": false, // New field for failure status
      "baseRatingValue": 0 // New field for rating calculation
    }

    score.songName = formData.get("songName")
    score.songDifficulty = formData.get("songDifficulty")
    score.songLevel = parseInt(formData.get("songLevel")) || 0
    score.perfectHits = parseInt(formData.get("perfectHits")) || 0
    score.greatHits = parseInt(formData.get("greatHits")) || 0
    score.goodHits = parseInt(formData.get("goodHits")) || 0
    score.badHits = parseInt(formData.get("badHits")) || 0
    score.missedHits = parseInt(formData.get("missedHits")) || 0

    // Checkbox is "on" if checked, null otherwise. Convert to boolean.
    score.failure = !!formData.get("failure");

    // Determine clear type, prioritizing failure
    if (score.failure) {
      score.specialClearType = "failed";
    }
    else if (score.greatHits === 0 && score.goodHits === 0 && score.badHits === 0 && score.missedHits === 0) {
      score.specialClearType = "allperfect"
    }
    else if (score.goodHits === 0 && score.badHits === 0 && score.missedHits === 0) {
      score.specialClearType = "fullcombo"
    }
    else {
      score.specialClearType = ""
    }

    score.technicalScore = calculateTechScore(score.perfectHits, score.greatHits, score.goodHits, score.badHits, score.missedHits)
    score.exScore = calculateExScore(score.perfectHits, score.greatHits, score.goodHits, score.badHits, score.missedHits)

    // Calculate Base Rating Value
    score.baseRatingValue = calculateRatingValue(score.songLevel, score.technicalScore);

    setScores(prevScores => [...prevScores, score]);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    saveScore(new FormData(e.target));
    e.target.reset();
  }

  // --- Import / Export Handlers ---

  const handleExport = () => {
    if (scores.length === 0) {
      setMessage({ type: 'error', text: 'No scores to export!' });
      return;
    }
    const dataStr = JSON.stringify(scores, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Filename format: psekai_scores_export_YYYY-MM-DD.json
    a.download = `psekai_scores_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Scores successfully exported!' });
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // Basic validation: check if it's an array and if items have expected keys
        if (Array.isArray(importedData) && importedData.every(item => item.songName && item.technicalScore !== undefined)) {
          setScores(importedData);
          setMessage({ type: 'success', text: `Successfully imported ${importedData.length} scores!` });
        } else {
          setMessage({ type: 'error', text: 'Import failed: File content is not a valid score array.' });
        }
      } catch (error) {
        console.error("Error parsing JSON during import:", error);
        setMessage({ type: 'error', text: 'Import failed: Error parsing JSON file.' });
      } finally {
        // Clear the file input value so the same file can be selected again if needed
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="bg-black text-white font-sans min-h-screen p-4 antialiased">
      <header className="bg-gray-900 text-gray-50 text-center py-8 shadow-md rounded-lg mb-6">
        <h1 className="text-4xl font-extrabold text-indigo-400">
          Project Sekai Score Tracker
        </h1>
        <p className="text-gray-400 mt-1">Technical Score and Rating Calculator</p>

        {/* PLAYER RATING DISPLAY (NEW) */}
        <div className="mt-4 pt-4 border-t border-gray-700 mx-auto max-w-sm">
          <p className="text-sm font-semibold text-gray-400 uppercase">Player Rating (Top 10)</p>
          <p className="text-5xl font-black text-amber-400 tracking-wider mt-1">
            {playerRating.toFixed(2)}
          </p>
        </div>

      </header>

      <main className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* --- ADD SCORE FORM --- */}
        <div id="addScoreBlock" className="bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
          <h2 className="text-2xl font-bold mb-4 text-gray-200 border-b border-gray-700 pb-2">Add a Score</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Song Metadata */}
            <div id="metadataBlock" className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-indigo-400">Song Metadata</h3>
              <div className="space-y-3">

                <div className="flex flex-col">
                  <label htmlFor="songName" className="text-sm font-medium text-gray-300">Song Name</label>
                  <input type="text" id="songName" name="songName" required className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="songDifficulty" className="text-sm font-medium text-gray-300">Song Difficulty</label>
                  <select id="songDifficulty" name="songDifficulty" className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                    <option value="master">Master</option>
                    <option value="append">Append</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="songLevel" className="text-sm font-medium text-gray-300">Song Level</label>
                  <input type="number" id="songLevel" name="songLevel" min="1" max="38" placeholder="Numerical difficulty 1-38" required className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
            </div>

            {/* Scoring Data */}
            <div id="scoringDataBlock" className="bg-gray-600 border border-gray-500 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-pink-400">Scoring Data (Note Hits)</h3>
              <div id="noteHitCounters" className="grid grid-cols-3 gap-2">

                {/* Inputs for Hits */}
                <input type="number" id="perfectHits" name="perfectHits" placeholder="Perfect" min="0" required className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white" />
                <input type="number" id="greatHits" name="greatHits" placeholder="Great" min="0" required className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white" />
                <input type="number" id="goodHits" name="goodHits" placeholder="Good" min="0" required className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white" />
                <input type="number" id="badHits" name="badHits" placeholder="Bad" min="0" required className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white" />
                <input type="number" id="missedHits" name="missedHits" placeholder="Miss" min="0" required className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white" />

                <div className="flex items-center space-x-2 justify-end">
                  <label htmlFor="failure" className="text-sm font-medium text-gray-300">Failed</label>
                  <input type="checkbox" id="failure" name="failure" className="w-4 h-4 text-indigo-400 border-gray-600 rounded bg-gray-800" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition duration-150"
            >
              Calculate & Save Score
            </button>
          </form>
        </div>

        {/* --- SCORES DISPLAY --- */}
        <div id="scoresBlock" className="lg:col-span-1">
          {/* --- Import/Export Buttons --- */}
          <div className="flex justify-start space-x-3 mb-4">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition duration-150 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>

            <label htmlFor="import-file"
              className="flex items-center space-x-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-150 cursor-pointer text-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </label>
            <input
              type="file"
              id="import-file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-200 border-b border-gray-700 pb-2">Recorded Scores ({scores.length})</h2>

          <div className="space-y-5">
            {scores.length === 0 ? (
              <p className="text-gray-400 italic p-4 bg-gray-700 rounded-lg shadow-inner">
                No scores recorded yet. Submit a score using the form to the left!
              </p>
            ) : (
              // Map over reversed scores, calculating the original index for deletion
              scores.slice().reverse().map((score, reversedIndex) => {
                const originalIndex = scores.length - 1 - reversedIndex;
                return (
                  <ScoreBox
                    key={originalIndex}
                    score={score}
                    onDelete={() => deleteScore(originalIndex)}
                  />
                );
              })
            )}
          </div>
        </div>

      </main>

      <footer>
        Created by LittleBit | Open-source on GitHub <a href="https://github.com/littlebitstudios/pjsk-tscore-rating-calculator"></a>
      </footer>

      <MessageDisplay message={message} onClose={() => setMessage(null)} />
    </div>
  )
}

export default App;