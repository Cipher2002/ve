'use client';

import React, { useState } from 'react';
import cn from 'classnames';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'normalize.css/normalize.css';
import Image from 'next/image';

// Import the video editor component
import ReactVideoEditor from './versions/7.0.0/react-video-editor';

import styles from './page.module.scss';

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <div className="min-h-screen overflow-y-auto"> {/* Enable scrolling for main page */}
      <nav className={cn(styles.headerSection, 'ansh-edit-video')}>
        {/* Main header section */}
        <div className={styles.colorContainer} />
        <div className={styles.contentWrapper}>
          <div className={styles.primaryColor} />
          <section className={styles.videoTransformationSection}>
            {/* Main section for video transformation content and actions. */}
            <div className={styles.contentWrapper1}>
              <div className={styles.textAndActionArea}>
                <div className={styles.textDescriptionWrapper}>
                  <article className={styles.headlineText_box}>
                    <span className={styles.headlineText}>
                      <span className={styles.headlineText_span0}>
                        Transform Text
                      </span>
                      <span className={styles.headlineText_span1}>
                        {' '}into Engaging Videos
                      </span>
                    </span>
                  </article>
                  <p className={styles.subHeadlineText}>
                    Turn your ideas into dynamic videos instantly, - ready for ads, social media, and marketing campaigns
                  </p>
                </div>
                <div className={styles.actionAreaWrapper}>
                  <button className={styles.exploreBtn}>
                    {/* TODO */}
                    <div className={styles.btnText}>Explore Now</div>
                    <Image className={styles.btnImage} src={'/assets/Ansh_edit_video/purple_double_arrows.svg'} alt="alt text" width={13} height={13} />
                  </button>
                  <div className={styles.creditsInfoWrapper}>
                    <p className={styles.creditsSymbol}>Z</p>
                    <div className={styles.creditsInfoBox_box}>
                      <span className={styles.creditsInfoBox}>
                        <span className={styles.creditsInfoBox_span0}>50 credits</span>
                        <span className={styles.creditsInfoBox_span1}>  </span>
                        <span className={styles.creditsInfoBox_span2}>per Generation</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.additionalActionsWrapper}>
                <button className={styles.tutorialBtn}>
                  {/* TODO */}
                  <Image className={styles.tutorialIcon} src={'/assets/Ansh_edit_video/play_button_icon.svg'} alt="alt text" width={24} height={24} />
                  <div className={styles.tutorialText}>Tutorial</div>
                </button>
                <div className={styles.playImageWrapper}>
                  <Image className={styles.playButtonImage} src={'/assets/Ansh_edit_video/83d41a9a8a6b2de7f0052e643ee63a25.svg'} alt="alt text" width={20} height={24} />
                </div>
              </div>
            </div>
          </section>

          {/* Admin/Client Mode Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative flex items-center rounded-lg p-1" style={{ backgroundColor: 'rgb(73, 9, 114)' }}>
              {/* Sliding background */}
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
              
              {/* Buttons */}
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
          </div>

          {/* Video Editor - Contained within a fixed height container */}
          <div className={styles.generateVideoSection}>
            <div 
              className="relative w-full rounded-2xl"
              style={{ 
                height: '800px',
                borderRadius: '16px',
                // clipPath: 'inset(0 round 16px)'

              }}
            >
            <ReactVideoEditor projectId="default-project" isAdminMode={isAdminMode} />
            </div>
          </div>

          <div className={styles.projectOverviewSection}>
            {/* Main content section for saved projects. */}
            <div className={styles.projectOverviewContainer}>
              <div className={styles.projectSummaryColumn}>
                <div className={styles.projectInfoWrapper}>
                  <p className={styles.projectInfoTitle}>Your Saved Projects</p>
                  <p className={styles.projectSuggestionDescription}>Here's what the AI suggests you need to know about this campaign</p>
                </div>
                <div className={styles.projectStatusColumn}>
                  <p className={styles.activeStatus}>{/* TODO */}Active</p>
                  <p className={styles.allStatus}>{/* TODO */}All</p>
                </div>
              </div>
              <div className={styles.projectImageSection}>
                <p className={styles.projectImageTitle}>Your Saved Projects</p>
                <Image className={styles.projectInfoImage} src={'/assets/Ansh_edit_video/9a9788395a1531ed893baccd9c3d86dd.svg'} alt="alt text" width={7} height={7} />
              </div>
              <div className={styles.projectControlColumn}>
                <div className={styles.filterControlWrapper}>
                  <div className={styles.dateFilterBlock}>
                    <p className={styles.dateSelectLabel}>Select Date</p>
                    <Image className={styles.calendarIcon} src={'/assets/Ansh_edit_video/97eba25dc5be6ddbb1d084dc70c4425b.svg'} alt="alt text" width={12} height={12} />
                  </div>
                  <div className={styles.searchControlWrapper}>
                    <p className={styles.searchLabel}>Search </p>
                    <div className={styles.color} />
                  </div>
                </div>
                <Image className={styles.additionalImageContent} src={'/assets/Ansh_edit_video/start_a_research.png'} alt="alt text" width={255} height={200} />
                <div className={styles.paginationSection}>
                  <p className={styles.entryCountInfo}>Showing 1-6 of 10 entries</p>
                  <div className={styles.paginationControlWrapper}>
                    <a className={styles.previousPage}>{/* Link for previous page in pagination controls. */}Previous</a>
                    <a className={styles.pageNumberOne}>1</a>
                    <a className={styles.pageNumberTwo}>2</a>
                    <a className={styles.nextPage}>{/* Link for next page in pagination controls. */}Next</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default App;