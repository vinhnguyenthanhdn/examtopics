import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Question, Language } from '../types';
import { getText } from '../lib/translations';
import '../styles/QuestionCard.css';
import '../styles/QuestionCardStats.css';

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    language: Language;
    userAnswer?: string;
    onSubmit: (answer: string) => void;
    onRequestTheory: () => void;
    onRequestExplanation: () => void;
    loadingAction: 'theory' | 'explanation' | null;
    userAnswers: Record<string, string>;
    allQuestions: Question[];
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    questionNumber,
    totalQuestions,
    language,
    userAnswer,
    onSubmit,
    onRequestTheory,
    onRequestExplanation,
    loadingAction,
    userAnswers: allUserAnswers,
    allQuestions
}) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    useEffect(() => {
        if (userAnswer) {
            setSelectedOptions(userAnswer.split(''));
        } else {
            setSelectedOptions([]);
        }
    }, [question.id, userAnswer]);

    const t = (key: string) => getText(language, key);
    const isLoadingAI = !!loadingAction;

    // Detect if this is a special question type (HOTSPOT or DRAG DROP)
    const isHotspot = question.question.includes('HOTSPOT -') || 
                      question.question.includes('DRAG DROP -') ||
                      question.correct_answer === 'HOTSPOT_REVIEW';

    const handleOptionChange = (optionLetter: string) => {
        if (question.is_multiselect) {
            setSelectedOptions(prev =>
                prev.includes(optionLetter)
                    ? prev.filter(o => o !== optionLetter)
                    : [...prev, optionLetter].sort()
            );
        } else {
            setSelectedOptions([optionLetter]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedOptions.length > 0) {
            onSubmit(selectedOptions.join(''));
        }
    };

    const handleSpecialSubmit = (status: 'CORRECT' | 'INCORRECT') => {
        // For HOTSPOT, we map "Understood" to the correct placeholder
        if (status === 'CORRECT') {
            onSubmit(question.correct_answer); // Mark as correct (HOTSPOT_REVIEW)
        } else {
            onSubmit('FAILED_REVIEW'); // Mark as incorrect
        }
    };

    const getOptionLetter = (option: string): string => {
        return option.split('.')[0].trim();
    };

    const isCorrect = userAnswer === question.correct_answer;
    const hasAnswered = !!userAnswer;

    // Stats calculation
    const totalAnswered = Object.keys(allUserAnswers).length;
    let correctCount = 0;

    Object.entries(allUserAnswers).forEach(([qId, ans]) => {
        const q = allQuestions.find(q => q.id === qId);
        if (q && q.correct_answer === ans) {
            correctCount++;
        }
    });

    const incorrectCount = totalAnswered - correctCount;
    const passRate = totalQuestions > 0
        ? ((correctCount / totalQuestions) * 100).toFixed(2)
        : '0.00';

    return (
        <div className="question-card card fade-in">
            {/* Header */}
            <div className="question-header">
                <h2>
                    {t('question_header')} {questionNumber}
                </h2>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                    />
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="stats-dashboard compact">
                <div className="stat-group main">
                    <span className="stat-label-inline">Pass Rate:</span>
                    <span className="stat-value-inline highlight">{passRate}%</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-group details">
                    <div className="stat-item-inline">
                        <span className="dot correct"></span> {correctCount} Correct
                    </div>
                    <div className="stat-item-inline">
                        <span className="dot incorrect"></span> {incorrectCount} Incorrect
                    </div>
                </div>
            </div>

            {/* Question Content */}
            <div className="question-text">
                <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {question.question}
                    </ReactMarkdown>
                </div>
                {question.is_multiselect && !isHotspot && (
                    <span className="multiselect-badge">{t('select_multiple')}</span>
                )}
            </div>

            {/* Interface for Regular vs HOTSPOT */}
            {!isHotspot ? (
                <form onSubmit={handleSubmit} className="question-form">
                    <div className="options-container">
                        {question.options.map((option) => {
                            const optionLetter = getOptionLetter(option);
                            const isSelected = selectedOptions.includes(optionLetter);
                            return (
                                <label key={optionLetter} className={`option-label ${isSelected ? 'selected' : ''}`}>
                                    <input
                                        type={question.is_multiselect ? 'checkbox' : 'radio'}
                                        name="answer"
                                        value={optionLetter}
                                        checked={isSelected}
                                        onChange={() => handleOptionChange(optionLetter)}
                                        disabled={isLoadingAI}
                                    />
                                    <span className="option-text">{option}</span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="action-buttons">
                        <button type="button" className="btn btn-secondary" onClick={onRequestTheory} disabled={isLoadingAI}>
                            {loadingAction === 'theory' ? t('loading_theory') : t('btn_theory')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onRequestExplanation} disabled={isLoadingAI}>
                            {loadingAction === 'explanation' ? t('loading_explanation') : t('btn_explain')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={selectedOptions.length === 0 || isLoadingAI}>
                            {t('btn_submit')}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="hotspot-actions-container">
                    <div className="action-buttons horizontal">
                        {question.discussion_link && (
                            <a 
                                href={question.discussion_link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-info"
                                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {t('view_on_examtopics')}
                            </a>
                        )}
                        <button 
                            type="button" 
                            className="btn btn-success" 
                            onClick={() => handleSpecialSubmit('CORRECT')}
                            disabled={hasAnswered}
                        >
                            {t('btn_understood')}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-danger" 
                            onClick={() => handleSpecialSubmit('INCORRECT')}
                            disabled={hasAnswered}
                        >
                            {t('btn_not_understood')}
                        </button>
                    </div>
                </div>
            )}

            {/* Answer Feedback for Regular Questions */}
            {hasAnswered && !isHotspot && (
                <div className={`answer-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="feedback-header">
                        {isCorrect ? t('correct') : t('incorrect')}
                    </div>
                    <div className="feedback-details">
                        <div><strong>{t('your_answer')}:</strong> {userAnswer}</div>
                        {!isCorrect && <div><strong>{t('correct_answer')}:</strong> {question.correct_answer}</div>}
                    </div>
                </div>
            )}

            {/* Feedback for HOTSPOT */}
            {hasAnswered && isHotspot && (
                <div className={`answer-feedback ${userAnswer === question.correct_answer ? 'correct' : 'incorrect'}`}>
                    <div className="feedback-header">
                        {userAnswer === question.correct_answer ? t('correct') : t('incorrect')}
                    </div>
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
                        {userAnswer === question.correct_answer 
                            ? "Bạn đã đánh dấu là đã hiểu câu hỏi này." 
                            : "Bạn đã đánh dấu cần xem lại câu hỏi này."}
                    </p>
                </div>
            )}
        </div>
    );
};
