import React from 'react';
import '../styles/Footer.css';

export const Footer: React.FC = () => {
    return (
        <footer className="app-footer">
            <div className="container">
                <div className="footer-content">
                    <p className="footer-text">
                        Made with ❤️ for PMI PMP Certification Aspirants
                    </p>
                    <p className="footer-contact">
                        📧 Contact: <a href="mailto:haobv@fpt.com">haobv@fpt.com</a>
                    </p>
                    <p className="footer-version">version: 1.0.1</p>
                </div>
            </div>
        </footer>
    );
};
