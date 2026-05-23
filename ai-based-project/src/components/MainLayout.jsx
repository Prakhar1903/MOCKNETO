import React from 'react';
import Header from './header.jsx';
import Footer from './Footer.jsx';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Outlet } from 'react-router-dom';

const MainLayout = ({ showFooter = true }) => {
    const location = useLocation();

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-[var(--header-height)] md:pt-[var(--header-height)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
            {showFooter && <Footer />}
        </div>
    );
};

export default MainLayout;
