'use client';

import React, { useState } from 'react';
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

  useEffect(() => {
    function sendHeight() {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'setIframeHeight', height }, '*');
    }

    // Send height initially and on resize
    window.addEventListener('load', sendHeight);
    window.addEventListener('resize', sendHeight);

    // Send height when DOM changes
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('load', sendHeight);
      window.removeEventListener('resize', sendHeight);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col"> {/* Added flex flex-col */}
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
                height: '100vh',
                maxWidth: '100%'
              }}
            >
              <ReactVideoEditor projectId="default-project" isAdminMode={isAdminMode} />
            </div>
          </div>
        </div>

        {/* Replaced Projects Section Card with SavedProjects Component */}
        <SavedProjects />
      </div>
    </div>
  );
}

export default App;