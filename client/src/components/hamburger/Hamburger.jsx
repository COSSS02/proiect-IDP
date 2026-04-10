import React from 'react';
import './Hamburger.css';

function HamburgerMenu({onClick}) {
    return (
        <button className="hamburger-menu" onClick={onClick}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
        </button>
    );
}

export default HamburgerMenu;