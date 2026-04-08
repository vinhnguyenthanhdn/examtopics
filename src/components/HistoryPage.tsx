import React, { useEffect, useState } from 'react';
import { UserSubmission, Question } from '../types';
import { getUserSubmissions, clearUserHistory } from '../lib/history-service';
import '../styles/HistoryPage.css';

interface HistoryPageProps {
    userId: string;
    questions: Question[];
    onJumpToQuestion: (index: number) => void;
    onBack: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
    userId,
    questions,
    onJumpToQuestion,
    onBack
}) => {
    const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [hideCorrect, setHideCorrect] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [userId]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getUserSubmissions(userId);
        setSubmissions(data);
        setLoading(false);
    };

    const handleClearHistory = async () => {
        if (confirm('Are you sure you want to clear your entire history? This cannot be undone.')) {
            await clearUserHistory(userId);
            setSubmissions([]);
        }
    };

    // Group submissions by question_id
    const groupedSubmissions = submissions.reduce((acc, sub) => {
        if (!acc[sub.question_id]) {
            acc[sub.question_id] = [];
        }
        acc[sub.question_id].push(sub);
        return acc;
    }, {} as Record<string, UserSubmission[]>);

    // Sort groups by latest submission time
    let sortedGroups = Object.entries(groupedSubmissions).sort(([, aSubs], [, bSubs]) => {
        const aLatest = new Date(aSubs[0].submitted_at).getTime();
        const bLatest = new Date(bSubs[0].submitted_at).getTime();
        return bLatest - aLatest;
    });

    // Calculate Pass Rate
    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter(s => s.is_correct).length;
    const passRate = totalSubmissions > 0
        ? Math.round((correctSubmissions / totalSubmissions) * 100)
        : 0;

    // Filter Logic: Hide if LATEST attempt is correct
    if (hideCorrect) {
        sortedGroups = sortedGroups.filter(([, groupSubs]) => {
            // groupSubs is sorted DESC by time, so index 0 is latest
            // However, verify sort order of groupSubs just in case
            // The API usually returns sorted, but let's be safe.
            // Actually, let's just find the max date item or trust index 0 if we sorted it?
            // User-service doesn't guarantee order inside group unless we sort.

            // Let's sort the groupSubs to be sure 0 is latest
            const sortedSubs = [...groupSubs].sort((a, b) =>
                new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            );
            return !sortedSubs[0].is_correct;
        });
    }

    if (loading) {
        return (
            <div className="history-page">
                <div className="loading-container" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading history...
                </div>
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="history-page fade-in">
                <div className="empty-state">
                    <h3>No history found</h3>
                    <p>Start answering questions to see your progress here!</p>
                    <button onClick={onBack} className="btn-home" style={{ marginTop: '1rem' }}>
                        Go Back to Quiz
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="history-page fade-in">
            {/* Header Section */}
            <div className="history-header">
                <div className="header-left">
                    <div className="title-row">
                        <button onClick={onBack} className="btn-home-icon" title="Back to Quiz">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        </button>
                        <h2 className="history-title">Submission History</h2>
                    </div>
                    <div className="history-stats">
                        <span className="stat-item">
                            <strong>{passRate}%</strong> Correct Rate
                        </span>
                        <span className="stat-divider">•</span>
                        <span className="stat-item">
                            <strong>{submissions.length}</strong> Total Submissions
                        </span>
                        <span className="stat-divider">•</span>
                        <span className="stat-item">
                            <strong>{Object.keys(groupedSubmissions).length}</strong> Questions Attempted
                        </span>
                    </div>

                    <div className="history-filters" style={{ marginTop: '0.5rem' }}>
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={hideCorrect}
                                onChange={(e) => setHideCorrect(e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            Hide Correct Questions
                        </label>
                    </div>
                </div>
                <button
                    onClick={handleClearHistory}
                    className="btn-clear-history"
                >
                    Clear History
                </button>
            </div>

            {/* List Section */}
            <div className="history-list">
                {sortedGroups.map(([questionId, groupSubs]) => {
                    const question = questions.find(q => q.id === questionId);
                    const questionIndex = questions.findIndex(q => q.id === questionId);

                    if (!question) return null;

                    return (
                        <div key={questionId} className="history-group">
                            <div className="group-header">
                                <div className="question-info">
                                    <div className="question-identifier">
                                        Question {questionIndex + 1}:
                                    </div>
                                    <div className="question-text-preview">
                                        {question.question}
                                    </div>
                                </div>
                                <button
                                    className="btn-jump"
                                    onClick={() => onJumpToQuestion(questionIndex)}
                                >
                                    Jump to Question
                                </button>
                            </div>

                            <div className="submissions-list">
                                {groupSubs.map((sub, idx) => {
                                    const submissionDate = new Date(sub.submitted_at);
                                    const formattedDate = submissionDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });
                                    const formattedTime = submissionDate.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    });

                                    return (
                                        <div key={sub.id} className="submission-item-compact">
                                            <div className="sub-left-content">
                                                <span className="attempt-number">#{groupSubs.length - idx}</span>
                                                <span className={`status-tag ${sub.is_correct ? 'correct' : 'incorrect'}`}>
                                                    {sub.is_correct ? 'CORRECT' : 'INCORRECT'}
                                                </span>
                                                <span className="answer-text">
                                                    You chose: <strong>{sub.user_answer}</strong>
                                                </span>
                                            </div>

                                            <div className="sub-right-content">
                                                <span className="sub-datetime">
                                                    {formattedDate} <span className="time-separator">at</span> {formattedTime}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
