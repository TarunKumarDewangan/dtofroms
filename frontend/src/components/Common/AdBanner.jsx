import React, { useEffect, useState } from 'react';
import { Card, Badge } from 'react-bootstrap';

/**
 * Reusable AdBanner Component
 * @param {string} slot - Google AdSense slot ID. If not provided, fallback custom banner is shown.
 * @param {string} adClient - Google AdSense Client ID (e.g. ca-pub-XXXXXXXXXXXXXXXX). Defaults to env variable.
 * @param {string} format - AdSense format: 'auto', 'fluid', 'rectangle', etc. Defaults to 'auto'.
 * @param {boolean} responsive - Is layout responsive. Defaults to true.
 * @param {string} fallbackTitle - Custom title for sponsor banner.
 * @param {string} fallbackDesc - Custom description for sponsor banner.
 * @param {string} fallbackLink - Target URL when clicking sponsor banner.
 */
const AdBanner = ({
    slot = '',
    adClient = 'ca-pub-2430201189761283', // Your AdSense Publisher ID
    format = 'auto',
    responsive = true,
    fallbackTitle = 'Quick Vehicle Verification Partner',
    fallbackDesc = 'Check vehicle fitness history, tax dues, and hypothecation details online in minutes.',
    fallbackLink = 'https://parivahan.gov.in/'
}) => {
    const [adFailed, setAdFailed] = useState(false);

    useEffect(() => {
        if (slot) {
            try {
                // Initialize Google AdSense block
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (err) {
                console.warn('AdSense push failed, falling back to custom banner:', err);
                setAdFailed(true);
            }
        }
    }, [slot]);

    // Render Google AdSense Block if slot is provided and AdSense hasn't failed
    if (slot && !adFailed) {
        return (
            <div className="ad-container no-print my-3 text-center" style={{ overflow: 'hidden', minHeight: '90px' }}>
                <small className="text-secondary d-block mb-1 text-uppercase font-monospace fs-10 tracking-widest">Sponsored Ad</small>
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client={adClient}
                    data-ad-slot={slot}
                    data-ad-format={format}
                    data-full-width-responsive={responsive ? 'true' : 'false'}
                />
            </div>
        );
    }

    // Otherwise, render a premium fallback sponsorship card that matches the dark glassmorphism theme
    return (
        <a 
            href={fallbackLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-decoration-none no-print d-block my-3 animate-fade-in"
        >
            <Card className="glass-card border-0 position-relative overflow-hidden hover-card transition-all" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(255, 255, 255, 0.05) !important' }}>
                <Card.Body className="p-3">
                    <div className="d-flex align-items-start gap-3">
                        <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center p-2.5" style={{ minWidth: '42px', height: '42px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <i className="bi bi-info-square text-info fs-5"></i>
                        </div>
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center justify-content-between gap-2">
                                <h6 className="text-white fw-bold mb-1 fs-14 text-truncate">{fallbackTitle}</h6>
                                <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary text-uppercase font-monospace tracking-wide px-1.5" style={{ fontSize: '9px' }}>Sponsor</Badge>
                            </div>
                            <p className="text-secondary mb-0 fs-12 line-clamp-2" style={{ lineHeight: '1.4' }}>
                                {fallbackDesc}
                            </p>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </a>
    );
};

export default AdBanner;
