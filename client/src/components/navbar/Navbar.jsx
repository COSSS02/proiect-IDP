import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Logo from '../../assets/logo.svg';
import Hamburger from '../hamburger/Hamburger';
import SideMenu from '../sidemenu/SideMenu';
import './Navbar.css';

function Navbar() {
    const { t, i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, login, register, logout } = useAuth();
    const { cartItemCount } = useCart();
    const navigate = useNavigate();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-left">
                    <Hamburger onClick={toggleMenu} />
                    <Link to="/" className="navbar-brand">
                        <img src={Logo} alt="E-Shop Logo" className="navbar-logo" />
                        <span>Tech-Shop</span>
                    </Link>
                </div>

                <form className="search-container" onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="search-button">{t('search')}</button>
                </form>

                <div className="nav-links">
                    <div className="language-switcher">
                        <button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>EN</button>
                        <button onClick={() => changeLanguage('ro')} disabled={i18n.language === 'ro'}>RO</button>
                    </div>
                    {user ? (
                        <>
                            <Link to="/profile" className="nav-button">{t('profile')}</Link>
                            <Link to="/cart" className="nav-cart-link nav-button">{t('cart')}
                                {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                            </Link>
                            <button onClick={logout} className="nav-button logout-button">{t('logout')}</button>
                        </>
                    ) : (
                        <>
                            <button onClick={login} className="nav-button">{t('login')}</button>
                            <button onClick={register} className="nav-button">{t('register')}</button>
                        </>
                    )}
                </div>
            </nav>
            <SideMenu isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />
        </>
    );
}

export default Navbar;