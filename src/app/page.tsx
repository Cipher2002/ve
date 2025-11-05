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
  // const [isAdminMode, setIsAdminMode] = useState(false);
  // const [isAccessBlocked, setIsAccessBlocked] = useState(true); // Start as blocked
  // const [isCheckComplete, setIsCheckComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to reset zoom level
  const resetZoom = () => {
    try {
      // Reset document zoom if it exists
      (document.body.style as any).zoom = '1';
      document.documentElement.style.transform = 'scale(1)';
      document.documentElement.style.transformOrigin = 'top left';
      
      // Also try to reset any CSS transforms that might affect scaling
      document.body.style.transform = 'scale(1)';
      document.body.style.transformOrigin = 'top left';
    } catch (e) {
      // Ignore any errors
    }
  };

  // // Allowed domains for iframe embedding
  // const allowedDomains = ['zanopy.ai']; // Add more domains here as needed

  // useEffect(() => {
  //   function checkFullscreenByViewport() {
  //     // Primary check: Fullscreen API detection
  //     const doc = document as any;
  //     const documentFullscreen = !!(
  //       document.fullscreenElement || 
  //       doc.webkitFullscreenElement || 
  //       doc.mozFullScreenElement || 
  //       doc.msFullscreenElement
  //     );
      
  //     // Check parent fullscreen safely
  //     let parentFullscreen = false;
  //     try {
  //       if (window.parent && window.parent !== window && window.parent.document) {
  //         const parentDoc = window.parent.document as any;
  //         parentFullscreen = !!(
  //           parentDoc.fullscreenElement ||
  //           parentDoc.webkitFullscreenElement ||
  //           parentDoc.mozFullScreenElement ||
  //           parentDoc.msFullscreenElement
  //         );
  //       }
  //     } catch (e) {
  //       // Cross-origin access denied - ignore
  //     }
      
  //     // Only use viewport detection as secondary check with stricter conditions
  //     const heightRatio = window.innerHeight / screen.height;
  //     const widthRatio = window.innerWidth / screen.width;
      
  //     // Much stricter viewport fullscreen detection
  //     const strictViewportFullscreen = (
  //       heightRatio >= 0.98 && 
  //       widthRatio >= 0.98 && 
  //       window.innerHeight >= 800 && // Minimum height for fullscreen
  //       window.innerWidth >= 1200    // Minimum width for fullscreen
  //     );
      
  //     // Final determination - prioritize API detection
  //     const isFullscreenDetected = documentFullscreen || parentFullscreen || strictViewportFullscreen;
      
  //     setIsFullscreen(isFullscreenDetected);
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

  //     // Check for auto-load video parameters
  //     const videoUrl = urlParams.get('url');
  //     const videoType = urlParams.get('type');
      
  //     if (videoUrl && videoType) {
  //       // Store in sessionStorage for the editor to pick up
  //       sessionStorage.setItem('autoLoadVideo', JSON.stringify({
  //         url: decodeURIComponent(videoUrl),
  //         type: videoType
  //       }));
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

  //   // Create ResizeObserver for more reliable detection
  //   const resizeObserver = new ResizeObserver(() => {
  //     checkFullscreenByViewport();
  //     sendHeight();
  //   });
  //   resizeObserver.observe(document.documentElement);

  //   // Send height initially and on resize
  //   window.addEventListener('load', sendHeight);
  //   window.addEventListener('resize', () => {
  //     sendHeight();
  //     checkFullscreenByViewport();
  //   });

  //   // Listen for fullscreen events with zoom reset
  //   const handleFullscreenChange = () => {
  //     checkFullscreenByViewport();
  //     // Reset zoom when exiting fullscreen
  //     setTimeout(() => {
  //       if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
  //         resetZoom();
  //       }
  //     }, 100);
  //   };

  //   const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange'];
  //   fullscreenEvents.forEach(event => {
  //     document.removeEventListener(event, handleFullscreenChange);
  //     try {
  //       if (window.parent && window.parent.document && window.parent !== window) {
  //         window.parent.document.removeEventListener(event, handleFullscreenChange);
  //       }
  //     } catch (e) {
  //       // Cross-origin access denied - ignore
  //     }
  //   });

  //   // Listen for orientation changes (mobile)
  //   window.addEventListener('orientationchange', () => {
  //     setTimeout(checkFullscreenByViewport, 100);
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
  //     window.removeEventListener('orientationchange', () => {
  //       setTimeout(checkFullscreenByViewport, 100);
  //     });
      
  //     // Remove fullscreen event listeners
  //     fullscreenEvents.forEach(event => {
  //       document.removeEventListener(event, checkFullscreenByViewport);
  //       if (window.parent && window.parent.document) {
  //         window.parent.document.removeEventListener(event, checkFullscreenByViewport);
  //       }
  //     });
      
  //     observer.disconnect();
  //     resizeObserver.disconnect();
  //   };
  // }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col"> {/* Added flex flex-col */}
      {/* Show content only after check is complete */}
      {/* {!isCheckComplete ? (
        // Loading state - minimal to avoid flash
        <div className="min-h-screen bg-white"></div>
      ) : isAccessBlocked ? ( */}
        {/* // Access Blocked */}
        {/* <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h1>
            <p className="text-gray-600">This content is not available in the current context.</p>
          </div>
        </div> */}
      {/* ) : ( */}
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
      <div className="w-full flex-1 flex flex-col overflow-hidden">
        {/* Video Editor Card */}
        <div className={cn(
          "bg-white border-b border-gray-200 overflow-hidden",
          !isFullscreen && "mb-8" // only add spacing if not fullscreen
        )}>
          <div className={styles.generateVideoSection}>
            {/* <div 
              className="relative w-full"
              style={{ 
                height: isFullscreen ? '100vh' : '45vh',
                maxWidth: '100%',
                minHeight: isFullscreen ? '100vh' : '45vh'
              }}
            > */}
            <div 
              className="relative w-full"
              style={{ 
                height: '100vh',
                maxWidth: '100%',
                minHeight: '100vh'
              }}
            >
              {/* <ReactVideoEditor projectId="default-project" isAdminMode={isAdminMode} /> */}
              <ReactVideoEditor projectId="default-project" />
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