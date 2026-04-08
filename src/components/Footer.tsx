import React from 'react';
import '../styles/Footer.css';

export const Footer: React.FC = () => {
    return (
        <footer className="app-footer">
            <div className="container">
                <div className="footer-content">
                    <p className="footer-text">
                        Made with ❤️ for Microsoft AI-900 Certification Aspirants
                    </p>
                    <p className="footer-contact">
                        📧 Contact: <a href="mailto:vinh.nguyenthanhdn@gmail.com">vinh.nguyenthanhdn@gmail.com</a>
                    </p>
                    <p className="footer-version">version: 1.0.1</p>
                </div>
            </div>
        </footer>
    );
};
