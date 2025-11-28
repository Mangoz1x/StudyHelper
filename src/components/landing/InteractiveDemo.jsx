'use client';

import { useState, useEffect } from 'react';
import ScrollReveal from './ScrollReveal';
import {
  Play,
  Sparkles,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BookOpen,
  Brain,
  RotateCcw,
  Upload,
  Loader2
} from 'lucide-react';

// Demo: AI Assessment Generator
function AssessmentDemo() {
  const [stage, setStage] = useState('idle'); // idle, analyzing, generating, ready
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const sampleContent = `The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration. The process involves glycolysis, the Krebs cycle, and the electron transport chain.`;

  const questions = [
    {
      question: 'What is the primary function of mitochondria?',
      options: ['Store genetic material', 'Produce ATP energy', 'Digest waste', 'Build proteins'],
      correct: 1,
    },
    {
      question: 'Which process occurs in the mitochondria?',
      options: ['Photosynthesis', 'Cell division', 'Cellular respiration', 'DNA replication'],
      correct: 2,
    },
    {
      question: 'What is produced through the electron transport chain?',
      options: ['Glucose', 'ATP', 'Carbon dioxide', 'Oxygen'],
      correct: 1,
    },
  ];

  const startDemo = () => {
    setStage('analyzing');
    setTimeout(() => setStage('generating'), 1500);
    setTimeout(() => setStage('ready'), 3000);
  };

  const handleAnswer = (index) => {
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const resetDemo = () => {
    setStage('idle');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-light)] overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="ml-3 text-sm font-medium text-[var(--text-secondary)]">AI Assessment Generator</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {stage === 'idle' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-2">
              <FileText className="h-4 w-4" />
              Sample Study Material
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] text-sm text-[var(--text-primary)] leading-relaxed">
              {sampleContent}
            </div>
            <button
              onClick={startDemo}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <Sparkles className="h-5 w-5" />
              Generate Assessment
            </button>
          </div>
        )}

        {(stage === 'analyzing' || stage === 'generating') && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {stage === 'analyzing' ? 'Analyzing content...' : 'Generating questions...'}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {stage === 'analyzing'
                ? 'Extracting key concepts and topics'
                : 'Creating personalized assessment'}
            </p>
            <div className="mt-6 w-48 mx-auto h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-1000"
                style={{ width: stage === 'analyzing' ? '50%' : '100%' }}
              />
            </div>
          </div>
        )}

        {stage === 'ready' && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                Score: {score}/{questions.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)]">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${((currentQuestion + (showResult ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">
                {questions[currentQuestion].question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {questions[currentQuestion].options.map((option, index) => {
                const isCorrect = index === questions[currentQuestion].correct;
                const isSelected = index === selectedAnswer;
                let optionClass = 'border-[var(--border-light)] hover:border-blue-500/50 hover:bg-blue-500/5';

                if (showResult) {
                  if (isCorrect) {
                    optionClass = 'border-emerald-500 bg-emerald-500/10';
                  } else if (isSelected && !isCorrect) {
                    optionClass = 'border-red-500 bg-red-500/10';
                  }
                } else if (isSelected) {
                  optionClass = 'border-blue-500 bg-blue-500/10';
                }

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && handleAnswer(index)}
                    disabled={showResult}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${optionClass}`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${
                      showResult && isCorrect ? 'border-emerald-500 text-emerald-600' :
                      showResult && isSelected && !isCorrect ? 'border-red-500 text-red-600' :
                      'border-[var(--border-medium)] text-[var(--text-secondary)]'
                    }`}>
                      {showResult && isCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                       showResult && isSelected && !isCorrect ? <XCircle className="h-4 w-4" /> :
                       String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            {showResult && (
              <div className="flex gap-3">
                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={nextQuestion}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-xl"
                  >
                    Next Question
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="flex-1 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-center">
                    <p className="font-semibold text-[var(--text-primary)]">
                      Quiz Complete! Score: {score}/{questions.length}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {score === questions.length ? 'Perfect score!' : 'Keep practicing!'}
                    </p>
                  </div>
                )}
                <button
                  onClick={resetDemo}
                  className="p-3 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Demo: Project Creation Preview
function ProjectDemo() {
  const [projectName, setProjectName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [created, setCreated] = useState(false);

  const icons = ['📚', '🧬', '🔬', '📐', '🎨', '💻'];
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

  const handleCreate = () => {
    if (projectName.trim()) {
      setCreated(true);
    }
  };

  const reset = () => {
    setProjectName('');
    setSelectedIcon(0);
    setCreated(false);
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-light)] overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="ml-3 text-sm font-medium text-[var(--text-secondary)]">Create Study Project</span>
        </div>
      </div>

      <div className="p-6">
        {!created ? (
          <div className="space-y-5">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Biology 101"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Choose Icon
              </label>
              <div className="flex gap-2">
                {icons.map((icon, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIcon(index)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                      selectedIcon === index
                        ? `${colors[index]} ring-2 ring-offset-2 ring-blue-500`
                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            {projectName && (
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${colors[selectedIcon]} flex items-center justify-center text-lg`}>
                    {icons[selectedIcon]}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{projectName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">0 materials</p>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={!projectName.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Project Created!</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              "{projectName}" is ready for your study materials
            </p>
            <div className="flex gap-3 justify-center">
              <button className="inline-flex items-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-xl text-sm">
                <Upload className="h-4 w-4" />
                Add Materials
              </button>
              <button
                onClick={reset}
                className="py-2.5 px-4 border border-[var(--border-light)] text-[var(--text-secondary)] font-medium rounded-xl text-sm hover:bg-[var(--bg-secondary)]"
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo: Material Upload Preview
function UploadDemo() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState([]);

  const sampleFiles = [
    { name: 'Chapter 5 Notes.pdf', type: 'pdf', size: '2.4 MB' },
    { name: 'Lecture Recording.mp4', type: 'video', size: '45 MB' },
    { name: 'Study Guide.docx', type: 'doc', size: '892 KB' },
  ];

  const addFiles = () => {
    setFiles(sampleFiles);
    setProcessing(true);

    sampleFiles.forEach((_, index) => {
      setTimeout(() => {
        setProcessed(prev => [...prev, index]);
        if (index === sampleFiles.length - 1) {
          setProcessing(false);
        }
      }, 1000 * (index + 1));
    });
  };

  const reset = () => {
    setFiles([]);
    setProcessed([]);
    setProcessing(false);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'video': return '🎬';
      case 'doc': return '📝';
      default: return '📎';
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-light)] overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="ml-3 text-sm font-medium text-[var(--text-secondary)]">Upload Materials</span>
        </div>
      </div>

      <div className="p-6">
        {files.length === 0 ? (
          <div
            onClick={addFiles}
            className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 mb-4">
              <Upload className="h-7 w-7 text-blue-600" />
            </div>
            <p className="font-medium text-[var(--text-primary)] mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              PDF, DOCX, MP4, images, and more
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  processed.includes(index)
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-[var(--border-light)] bg-[var(--bg-secondary)]'
                }`}
              >
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{file.size}</p>
                </div>
                {processed.includes(index) ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                ) : processing ? (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                ) : null}
              </div>
            ))}

            {!processing && processed.length === files.length && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-center">
                <p className="font-medium text-[var(--text-primary)]">All files processed!</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">AI has extracted key topics and summaries</p>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-2.5 border border-[var(--border-light)] text-[var(--text-secondary)] font-medium rounded-xl text-sm hover:bg-[var(--bg-secondary)]"
            >
              Reset Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InteractiveDemo() {
  const [activeDemo, setActiveDemo] = useState('assessment');

  const demos = [
    { id: 'assessment', label: 'AI Assessment', icon: Brain },
    { id: 'project', label: 'Create Project', icon: BookOpen },
    { id: 'upload', label: 'Upload Files', icon: Upload },
  ];

  return (
    <section id="demo" className="py-32 bg-[var(--bg-secondary)] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal animation="fade-up" className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mb-4">
            <Play className="h-4 w-4" />
            Interactive Demo
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Try it yourself
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[var(--text-secondary)]">
            Experience the power of StudyHelper with these interactive demos.
            No sign-up required.
          </p>
        </ScrollReveal>

        {/* Demo Tabs */}
        <ScrollReveal animation="fade-up" delay={1}>
          <div className="flex justify-center gap-2 mb-8">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
                  activeDemo === demo.id
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-light)]'
                }`}
              >
                <demo.icon className="h-4 w-4" />
                {demo.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Demo Content */}
        <ScrollReveal animation="scale" delay={2}>
          <div className="max-w-xl mx-auto">
            {activeDemo === 'assessment' && <AssessmentDemo />}
            {activeDemo === 'project' && <ProjectDemo />}
            {activeDemo === 'upload' && <UploadDemo />}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
