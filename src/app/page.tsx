'use client';

import React, { useState, Suspense } from 'react';
import cn from 'classnames';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'normalize.css/normalize.css';
import Image from 'next/image';

// Import the video editor component
import ReactVideoEditor from './versions/7.0.0/react-video-editor';
// Import the SavedProjects component
import SavedProjects from './versions/7.0.0/saved-projects'; // Adjust path as needed

import styles from './page.module.scss';
import { useEffect } from 'react';

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  // const [isAccessBlocked, setIsAccessBlocked] = useState(true); // Start as blocked
  const [isCheckComplete, setIsCheckComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Allowed domains for iframe embedding
  // const allowedDomains = ['zanopy.ai']; // Add more domains here as needed

  // useEffect(() => {
  //   function checkFullscreenByViewport() {
  //     // Check if viewport matches screen dimensions (indicating fullscreen)
  //     const isViewportFullscreen = window.innerHeight === screen.height && window.innerWidth === screen.width;
  //     setIsFullscreen(isViewportFullscreen);
  //   }

  //   function checkAccess() {
  //     // Check if required parameters exist
  //     const urlParams = new URLSearchParams(window.location.search);
  //     const sid = urlParams.get('sid');
  //     const uid = urlParams.get('uid');
  //     const email = urlParams.get('email');
  //     const pid = urlParams.get('pid');

  //     if (!sid || !uid || !email || !pid) {
  //       setIsAccessBlocked(true);
  //       setIsCheckComplete(true);
  //       return;
  //     }

  //     // Check if in iframe and from allowed domain
  //     if (window.top === window.self) {
  //       // Not in iframe - block access
  //       setIsAccessBlocked(true);
  //       setIsCheckComplete(true);
  //       return;
  //     }

  //     // Check referrer domain
  //     const referrer = document.referrer;
  //     if (!referrer) {
  //       setIsAccessBlocked(true);
  //       setIsCheckComplete(true);
  //       return;
  //     }

  //     try {
  //       const referrerDomain = new URL(referrer).hostname;
  //       const isAllowedDomain = allowedDomains.some(domain => 
  //         referrerDomain === domain || referrerDomain.endsWith('.' + domain)
  //       );
        
  //       if (!isAllowedDomain) {
  //         setIsAccessBlocked(true);
  //         setIsCheckComplete(true);
  //         return;
  //       }
  //     } catch (e) {
  //       setIsAccessBlocked(true);
  //       setIsCheckComplete(true);
  //       return;
  //     }

  //     // All checks passed
  //     setIsAccessBlocked(false);
  //     setIsCheckComplete(true);
  //   }

  //   function sendHeight() {
  //     const height = document.documentElement.scrollHeight;
  //     window.parent.postMessage({ type: 'setIframeHeight', height }, '*');
  //   }

  //   // Check access first
  //   checkAccess();

  //   // Check fullscreen state initially
  //   checkFullscreenByViewport();

  //   // Send height initially and on resize
  //   window.addEventListener('load', sendHeight);
  //   window.addEventListener('resize', () => {
  //     sendHeight();
  //     checkFullscreenByViewport();
  //   });

  //   // Send height when DOM changes
  //   const observer = new MutationObserver(sendHeight);
  //   observer.observe(document.body, { childList: true, subtree: true });

  //   return () => {
  //     window.removeEventListener('load', sendHeight);
  //     window.removeEventListener('resize', () => {
  //       sendHeight();
  //       checkFullscreenByViewport();
  //     });
  //     observer.disconnect();
  //   };
  // }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col"> {/* Added flex flex-col */}
      {/* Show content only after check is complete */}
      {/* {!isCheckComplete ? (
        // Loading state - minimal to avoid flash
        <div className="min-h-screen bg-white"></div>
      ) : isAccessBlocked ? (
        // Access Blocked
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h1>
            <p className="text-gray-600">This content is not available in the current context.</p>
          </div>
        </div>
      ) : ( */}
      {/* // Normal content */}
      <>
      {/* Admin/Client Mode Toggle - Keep at top, centered */}
      {/* <div className="flex items-center justify-center py-6">
        <div className="relative flex items-center rounded-lg p-1" style={{ backgroundColor: 'rgb(73, 9, 114)' }}>
          <div 
            className="absolute rounded-md bg-white shadow-sm transition-transform duration-300 ease-in-out"
            style={{
              width: 'calc(50% - 4px)',
              height: 'calc(100% - 8px)',
              top: '4px',
              left: '4px',
              transform: isAdminMode ? 'translateX(calc(100% + 0px))' : 'translateX(0%)'
            }}
          />
          
          <button
            onClick={() => setIsAdminMode(false)}
            className={`relative z-10 px-4 py-2 rounded-md transition-colors duration-300 flex-1 whitespace-nowrap ${
              !isAdminMode 
                ? 'text-gray-900' 
                : 'text-white hover:text-gray-200'
            }`}
          >
            Client Mode
          </button>
          <button
            onClick={() => setIsAdminMode(true)}
            className={`relative z-10 px-4 py-2 rounded-md transition-colors duration-300 flex-1 whitespace-nowrap ${
              isAdminMode 
                ? 'text-gray-900' 
                : 'text-white hover:text-gray-200'
            }`}
          >
            Admin Mode
          </button>
        </div>
      </div> */}

      {/* Centered content container */}
      <div className="w-full flex-1 flex flex-col">
        {/* Video Editor Card */}
        <div className="bg-white border-b border-gray-200 mb-8 overflow-hidden">
          <div className={styles.generateVideoSection}>
            <div 
              className="relative w-full"
              style={{ 
                // height: isFullscreen ? '100vh' : '45vh',
                height: '100vh',
                maxWidth: '100%'
              }}
            >
              <ReactVideoEditor projectId="default-project" isAdminMode={isAdminMode} />
            </div>
          </div>
        </div>

        {/* Replaced Projects Section Card with SavedProjects Component */}
        {!isFullscreen && <SavedProjects />}
        </div>
      </>
      {/* )} */}
    </div>
  );
}

export default App;