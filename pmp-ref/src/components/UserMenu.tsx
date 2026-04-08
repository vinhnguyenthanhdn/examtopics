import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Language } from '../types';
import { supabase } from '../lib/supabase';
import '../styles/UserMenu.css';

interface UserMenuProps {
    user: User;
    isAdmin?: boolean;
    isAdminView?: boolean;
    isHistoryView?: boolean;
    onAdminClick?: () => void;
    onHistoryClick?: () => void;
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
    user,
    isAdmin,
    isAdminView,
    isHistoryView,
    onAdminClick,
    onHistoryClick,
    currentLanguage,
    onLanguageChange
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleAdmin = () => {
        if (onAdminClick) {
            onAdminClick();
            closeMenu();
        }
    };

    const handleHistory = () => {
        if (onHistoryClick) {
            onHistoryClick();
            closeMenu();
        }
    };

    // Determine avatar
    const avatarUrl = user.user_metadata?.avatar_url;
    const initial = user.email ? user.email[0].toUpperCase() : 'U';

    return (
        <div className="user-menu-wrapper">
            {isOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

            <button className="user-avatar-btn" onClick={toggleMenu} title="User Menu">
                <div className="user-info-text">
                    <span className="user-name-display">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                </div>
                {avatarUrl ? (
                    <img src={avatarUrl} alt="User" />
                ) : (
                    <div className="user-avatar-placeholder">{initial}</div>
                )}
            </button>

            {isOpen && (
                <div className="user-menu-dropdown">
                    <div className="menu-header">
                        <span className="user-email" title={user.email}>{user.email}</span>
                        {isAdmin && <span className="user-role">Administrator</span>}
                    </div>

                    <div className="menu-lang-switcher">
                        <button
                            className={`menu-lang-btn ${currentLanguage === 'vi' ? 'active' : ''}`}
                            onClick={() => onLanguageChange('vi')}
                        >
                            🇻🇳 Tiếng Việt
                        </button>
                        <button
                            className={`menu-lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                            onClick={() => onLanguageChange('en')}
                        >
                            🇬🇧 English
                        </button>
                    </div>

                    {isAdmin && (
                        <button className="menu-item" onClick={handleAdmin}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            {isAdminView ? 'Back to Quiz' : 'Admin Dashboard'}
                        </button>
                    )}

                    {!isAdminView && onHistoryClick && (
                        <button className={`menu-item ${isHistoryView ? 'active' : ''}`} onClick={handleHistory} style={isHistoryView ? { color: 'var(--color-primary)', fontWeight: 'bold', background: 'var(--color-bg-secondary)' } : {}}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            My History
                        </button>
                    )}

                    <button className="menu-item logout" onClick={handleLogout}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};
