import React, { useState, useEffect, useRef } from 'react';

const TransliteratedInput = ({
    value = '',
    onChange,
    name,
    placeholder,
    className = 'form-control-dark',
    required = false,
    disabled = false,
    style = {},
    as = 'input',
    rows = 1
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [show, setShow] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShow(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getActiveWord = (text) => {
        if (!text) return '';
        const words = text.split(/\s+/);
        return words[words.length - 1] || '';
    };

    const handleTextChange = (e) => {
        const val = e.target.value;
        
        // Trigger standard onChange
        onChange(e);

        // Transliterate logic
        const currentWord = getActiveWord(val);
        // Only fetch if it's purely english letters
        if (currentWord && /^[a-zA-Z]+$/.test(currentWord)) {
            fetchSuggestions(currentWord);
        } else {
            setSuggestions([]);
            setShow(false);
        }
    };

    const fetchSuggestions = async (word) => {
        try {
            const res = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=hi-t-i0-und&num=5`);
            if (res.ok) {
                const data = await res.json();
                if (data && data[0] === 'SUCCESS' && data[1] && data[1][0]) {
                    const alternatives = data[1][0].transliterations[0]?.alternative || [];
                    // Ensure the original word is also selectable if they want to keep it
                    if (alternatives.length > 0 && !alternatives.includes(word)) {
                        alternatives.push(word);
                    }
                    setSuggestions(alternatives);
                    setShow(alternatives.length > 0);
                    setSelectedIndex(0);
                }
            }
        } catch (err) {
            console.error('Transliteration service error:', err);
        }
    };

    const selectSuggestion = (selectedWord) => {
        // Find the last word of English letters, preserving everything before it (newlines, symbols)
        const match = value.match(/^(.*?)(\b[a-zA-Z]+)$/s);
        let newValue;
        if (match) {
            newValue = match[1] + selectedWord + ' ';
        } else {
            newValue = value + ' ';
        }

        // Synthesize a synthetic event to match standard react inputs
        const event = {
            target: {
                name: name,
                value: newValue
            }
        };
        onChange(event);
        setShow(false);
        setSuggestions([]);
        setSelectedIndex(0);
    };

    const handleKeyDown = (e) => {
        if (show && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectSuggestion(suggestions[selectedIndex]);
            } else if (e.key === ' ') {
                e.preventDefault();
                selectSuggestion(suggestions[selectedIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShow(false);
            }
        }
    };

    const InputComponent = as === 'textarea' ? 'textarea' : 'input';

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', display: 'inline-block' }}>
            <InputComponent
                type={as === 'input' ? 'text' : undefined}
                rows={as === 'textarea' ? rows : undefined}
                className={className}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                required={required}
                disabled={disabled}
                style={{ ...style, width: '100%' }}
                autoComplete="off"
            />
            {show && suggestions.length > 0 && (
                <div 
                    className="no-print transliteration-dropdown"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 99999,
                        marginTop: '4px',
                        width: 'auto',
                        minWidth: '200px',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}
                >
                    <div className="transliteration-dropdown-header">
                        हिन्दी विकल्प (SPACE / ENTER)
                    </div>
                    {suggestions.map((item, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => selectSuggestion(item)}
                            className={`transliteration-dropdown-item ${idx === selectedIndex ? 'active' : ''}`}
                            onMouseOver={() => setSelectedIndex(idx)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransliteratedInput;

