import React from 'react';
import { LanguageSelector } from './LanguageSelector';
import { AuthButton } from './AuthButton';
import { UserMenu } from './UserMenu';
import type { Language } from '../types';
import '../styles/Header.css';

interface HeaderProps {
    currentLanguage: Language;
    onLanguageChange: (language: Language) => void;
    onHistoryClick?: () => void;
    isHistoryView?: boolean;
    user?: any;
    isAdmin?: boolean;
    onAdminClick?: () => void;
    isAdminView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    currentLanguage,
    onLanguageChange,
    onHistoryClick,
    isHistoryView,
    user,
    isAdmin,
    onAdminClick,
    isAdminView
}) => {
    return (
        <header className="app-header">
            <div className="container">
                <div className="header-content">
                    {/* Controls Row: Auth & Navigation */}
                    <div className="header-controls">
                        {user ? (
                            <UserMenu
                                user={user}
                                isAdmin={isAdmin}
                                isAdminView={isAdminView}
                                isHistoryView={isHistoryView}
                                onAdminClick={onAdminClick}
                                onHistoryClick={onHistoryClick}
                                currentLanguage={currentLanguage}
                                onLanguageChange={onLanguageChange}
                            />
                        ) : (
                            // Empty div or nothing on left side for guest? 
                            // Actually AuthButton is usually on right or center. 
                            // If guest, we just show AuthButton.
                            null
                        )}

                        {/* If guest, show AuthButton separately. If user, UserMenu handles logout */}
                        {!user && <AuthButton currentLanguage={currentLanguage} />}
                    </div>

                    {!user && (
                        <LanguageSelector
                            currentLanguage={currentLanguage}
                            onLanguageChange={onLanguageChange}
                        />
                    )}
                    <h1 className="app-title">
                        PMP Exam Master
                    </h1>
                    <p className="app-subtitle">
                        Pass the PMI Project Management Professional Exam
                    </p>
                </div>
            </div>
        </header>
    );
};
