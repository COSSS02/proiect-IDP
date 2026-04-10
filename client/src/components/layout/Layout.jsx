import React from 'react';
import Navbar from '../navbar/Navbar';

const Layout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main className="container">{children}</main>
        </>
    );
};

export default Layout;