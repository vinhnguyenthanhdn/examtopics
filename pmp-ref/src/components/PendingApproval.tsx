import React from 'react';
import { getText } from '../lib/translations';
import { supabase } from '../lib/supabase';
import type { Language } from '../types';
import '../styles/LoginRequired.css'; // Reusing the same styles

interface PendingApprovalProps {
    language: Language;
}

export const PendingApproval: React.FC<PendingApprovalProps> = ({ language }) => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div className="login-required-container">
            <div className="login-card">
                <div role="img" aria-label="Hourglass" className="login-icon">
                    ⏳
                </div>

                <h2 className="login-title">
                    {getText(language, 'pending_approval_title')}
                </h2>

                <p className="login-desc">
                    {getText(language, 'pending_approval_desc')}
                </p>

                <button
                    onClick={handleLogout}
                    className="login-btn-large"
                    aria-label="Sign out"
                    style={{ justifyContent: 'center' }}
                >
                    <span>{getText(language, 'logout')}</span>
                </button>
            </div>
        </div>
    );
};
