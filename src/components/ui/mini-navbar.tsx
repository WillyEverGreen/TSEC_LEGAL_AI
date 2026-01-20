"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AnimatedNavLink = ({ href, children, isActive }: { href: string; children: React.ReactNode; isActive?: boolean }) => {
  const defaultTextColor = isActive ? 'text-white font-medium' : 'text-gray-400';
  const hoverTextColor = 'text-white';
  const textSizeClass = 'text-sm';

  return (
    <Link to={href} className={`group relative block overflow-hidden h-5 ${textSizeClass}`}>
      <div className="flex flex-col transition-transform duration-300 ease-out transform group-hover:-translate-y-1/2">
        <span className={`block h-5 leading-5 ${defaultTextColor}`}>{children}</span>
        <span className={`block h-5 leading-5 ${hoverTextColor}`}>{children}</span>
      </div>
    </Link>
  );
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const logoElement = (
    <Link to="/" className="relative flex items-center justify-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all">
             <Scale className="w-4 h-4 text-white" />
        </div>
        <span className="font-serif font-bold text-white hidden sm:block">LegalAI</span>
    </Link>
  );

  const navLinksData = [
    { label: 'Home', href: '/' },
    { label: 'Assistant', href: '/chat' },
    { label: 'Compare', href: '/compare' },
    { label: 'Summarizer', href: '/summarize' },
  ];

  return (
    <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50
                       flex flex-col items-center
                       pl-4 pr-4 py-3 backdrop-blur-md
                       ${headerShapeClass}
                       border border-white/10 bg-black/50
                       w-[calc(100%-2rem)] sm:w-auto min-w-[320px] sm:min-w-[800px]
                       transition-[border-radius] duration-300 ease-in-out shadow-2xl`}>

      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">
           {logoElement}
        </div>

        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href} isActive={location.pathname === link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
           <Link to="/chat">
               <button className="px-5 py-2 text-xs font-medium text-black bg-white rounded-full hover:bg-gray-200 transition-colors duration-200 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  Launch App
               </button>
           </Link>
        </div>

        <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
          {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          {navLinksData.map((link) => (
            <Link key={link.href} to={link.href} className="text-gray-300 hover:text-white transition-colors w-full text-center py-2" onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full pb-2">
           <Link to="/chat" className="w-full">
               <button className="w-full px-4 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-gray-200 transition-colors">
                  Launch App
               </button>
           </Link>
        </div>
      </div>
    </header>
  );
}
