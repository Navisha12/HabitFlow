import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (isIOSDevice && !isStandalone) {
            // Show iOS install instructions after a delay
            setTimeout(() => setIsIOS(true), 3000);
        }

        // Listen for the beforeinstallprompt event (Android/Desktop)
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('App installed');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setIsIOS(false);
        // Don't show again for this session
        sessionStorage.setItem('installPromptDismissed', 'true');
    };

    // Don't show if already dismissed this session
    if (sessionStorage.getItem('installPromptDismissed')) {
        return null;
    }

    // Android/Desktop install prompt
    if (showPrompt && deferredPrompt) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000,
                animation: 'slideUp 0.3s ease'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Download size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Install HabitFlow</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Add to your home screen for quick access
                    </p>
                </div>
                <button
                    onClick={handleInstall}
                    className="btn btn-primary"
                    style={{ flexShrink: 0 }}
                >
                    Install
                </button>
                <button
                    onClick={handleDismiss}
                    className="btn btn-ghost btn-icon"
                    style={{ flexShrink: 0 }}
                >
                    <X size={18} />
                </button>
            </div>
        );
    }

    // iOS install instructions
    if (isIOS) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000,
                animation: 'slideUp 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Download size={20} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Install HabitFlow</h4>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Tap the <strong>Share</strong> button in Safari, then tap <strong>"Add to Home Screen"</strong>
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="btn btn-ghost btn-icon"
                        style={{ flexShrink: 0 }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
