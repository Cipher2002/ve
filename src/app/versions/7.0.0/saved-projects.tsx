'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';


interface ProjectFile {
  fileName: string;
  timestamp: string;
  type: 'video' | 'audio' | 'media';
  fileSize: number;
  fileExtension: string;
  filePath: string;
  isRender?: boolean;
  thumbnailPath?: string | null;
}

interface UserProject {
  id: string;
  name: string;
  uid: string;
  status: string;
  createdAt: string;
  lastUpdated: string;
  lastSaved: string;
  lastRender: string;
  saves: ProjectFile[];
  renders: ProjectFile[];
  saveCount: number;
  renderCount: number;
  folderPath: string;
}

// Simple date input component for mobile/tablet
function SimpleDatePicker({ 
  startDate, 
  endDate, 
  onDateChange, 
  onApply, 
  onCancel 
}: {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const [localStart, setLocalStart] = useState(startDate.toISOString().split('T')[0]);
  const [localEnd, setLocalEnd] = useState(endDate.toISOString().split('T')[0]);

  const handleApply = () => {
    const start = new Date(localStart);
    const end = new Date(localEnd);
    onDateChange(start, end);
    onApply();
  };

  return (
    <div className="p-4 space-y-4 max-w-[280px]">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          value={localStart}
          onChange={(e) => setLocalStart(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input
          type="date"
          value={localEnd}
          onChange={(e) => setLocalEnd(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
          className="bg-blue-500 hover:bg-blue-600 flex-1"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

// Date Range Calendar Component
function DateRangeCalendar({ 
  startDate, 
  endDate, 
  onDateChange, 
  onApply, 
  onCancel 
}: {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (days.length >= 42) break;
    }
    
    return days;
  };

  const isSelected = (date: Date) => {
    return (date.toDateString() === startDate.toDateString()) || 
           (date.toDateString() === endDate.toDateString());
  };

  const isInRange = (date: Date) => {
    return date >= startDate && date <= endDate;
  };

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      onDateChange(date, date > endDate ? date : endDate);
      setSelectingStart(false);
    } else {
      onDateChange(date < startDate ? date : startDate, date);
      setSelectingStart(true);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const days = generateCalendar(currentMonth);
  const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const nextMonthDays = generateCalendar(nextMonthDate);

  return (
    <div className="flex flex-col gap-2 max-w-[280px]">
      {/* First Calendar - Always single month */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <div className="font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                p-1 text-xs hover:bg-blue-100 rounded
                ${date.getMonth() !== currentMonth.getMonth() ? 'text-gray-300' : ''}
                ${isSelected(date) ? 'bg-blue-500 text-white' : ''}
                ${isInRange(date) && !isSelected(date) ? 'bg-blue-100' : ''}
              `}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* Second Calendar - Remove completely for iframe */}
        <div className="hidden">
        <div className="flex items-center justify-center mb-4">
          <div className="font-medium">
            {nextMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {nextMonthDays.map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                p-2 text-sm hover:bg-blue-100 rounded
                ${date.getMonth() !== nextMonthDate.getMonth() ? 'text-gray-300' : ''}
                ${isSelected(date) ? 'bg-blue-500 text-white' : ''}
                ${isInRange(date) && !isSelected(date) ? 'bg-blue-100' : ''}
              `}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center mt-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onApply}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SavedProjects() {
  const [activeFilter, setActiveFilter] = useState('Active');
  const [searchValue, setSearchValue] = useState('');
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<UserProject | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [loadingProjectFiles, setLoadingProjectFiles] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return {
      start: oneYearAgo,
      end: now
    };
  });
  const [currentFilesPage, setCurrentFilesPage] = useState(1);
  const [filesPerPage, setFilesPerPage] = useState(4);
  const [filesActiveFilter, setFilesActiveFilter] = useState('All');
  const [filesSearchValue, setFilesSearchValue] = useState('');
  const [filesDateFilter, setFilesDateFilter] = useState('all');
  const [showFilesDatePicker, setShowFilesDatePicker] = useState(false);
  const [filesCustomDateRange, setFilesCustomDateRange] = useState(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return {
      start: oneYearAgo,
      end: now
    };
  });
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [templateApplied, setTemplateApplied] = useState<string | null>(null);
  const [downloadingProject, setDownloadingProject] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    status: string;
    current: number;
    total: number;
    message: string;
  } | null>(null);

  //SETTING THE API BASE URL
  const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

  // // Responsive pagination hook
  // useEffect(() => {
  //   const updateItemsPerPage = () => {
  //     const width = window.innerWidth;
  //     let newItemsPerPage;
  //     let newFilesPerPage;
      
  //     if (width < 580) {
  //       // Mobile: 1 card
  //       newItemsPerPage = 1;
  //       newFilesPerPage = 1;
  //     } else if (width < 880) {
  //       // Small tablet: 2 cards
  //       newItemsPerPage = 2;
  //       newFilesPerPage = 2;
  //     } else if (width < 1180) {
  //       // Large tablet: 3 cards
  //       newItemsPerPage = 3;
  //       newFilesPerPage = 3;
  //     } else {
  //       // Desktop: 4 cards
  //       newItemsPerPage = 4;
  //       newFilesPerPage = 4;
  //     }
      
  //     setItemsPerPage(newItemsPerPage);
  //     setFilesPerPage(newFilesPerPage);
      
  //     // Reset to first page when items per page changes
  //     setCurrentPage(1);
  //     setCurrentFilesPage(1);
  //   };

  //   // Initial check
  //   updateItemsPerPage();

  //   // Add resize listener
  //   window.addEventListener('resize', updateItemsPerPage);
    
  //   return () => window.removeEventListener('resize', updateItemsPerPage);
  // }, []);

  // Responsive pagination hook
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      let newItemsPerPage;
      let newFilesPerPage;
      
      console.log('Window width:', width); // Debug log
      
      if (width < 580) {
        // Mobile: 1 card
        newItemsPerPage = 1;
        newFilesPerPage = 1;
      } else if (width < 880) {
        // Small tablet: 2 cards
        newItemsPerPage = 2;
        newFilesPerPage = 2;
      } else if (width < 1100) {  // Reduced from 1180 to 1100
        // Large tablet: 3 cards
        newItemsPerPage = 3;
        newFilesPerPage = 3;
      } else {
        // Desktop: 4 cards
        newItemsPerPage = 4;
        newFilesPerPage = 4;
      }
      
      console.log('Items per page:', newItemsPerPage); // Debug log
      
      setItemsPerPage(newItemsPerPage);
      setFilesPerPage(newFilesPerPage);
      
      // Reset to first page when items per page changes
      setCurrentPage(1);
      setCurrentFilesPage(1);
    };

    // Initial check
    updateItemsPerPage();

    // Add resize listener
    window.addEventListener('resize', updateItemsPerPage);
    
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  // Get display text for date filter
  const getDateFilterDisplay = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'all':
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return `${oneYearAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return `${startOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'custom':
        return `${customDateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${customDateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      default:
        return 'All';
    }
  };

  // Get display text for files date filter
  const getFilesDateFilterDisplay = () => {
    const now = new Date();
    switch (filesDateFilter) {
      case 'all':
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return `${oneYearAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return `${startOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'custom':
        return `${filesCustomDateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${filesCustomDateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      default:
        return 'All';
    }
  };

  // Get UID from URL
  const getUidFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid') || 'default';
  };

  // Debug UID values
  React.useEffect(() => {
    console.log('🔍 Saved Projects UID Debug:', {
      fromFunction: getUidFromUrl(),
      fromURL: new URLSearchParams(window.location.search).get('uid'),
      selectedProjectId: selectedProject?.id,
      fullThumbnailURL: selectedProject ? 
        `${apiBaseUrl}/user-files/${getUidFromUrl()}/${selectedProject.id}/thumbnail-example.webp` : 
        'No project selected'
    });
  }, [selectedProject]);

  // Fetch user projects
  const fetchUserProjects = async () => {
    const uid = getUidFromUrl();
    try {
      const response = await fetch(`${apiBaseUrl}/save-to-user/get?uid=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setUserProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rendered files for selected project
  const fetchProjectFiles = async (projectId: string) => {
    const uid = getUidFromUrl();
    setLoadingProjectFiles(true);
    try {
      const rendersResponse = await fetch(`${apiBaseUrl}/save-to-user/get-renders?uid=${uid}&projectId=${projectId}`);

      if (rendersResponse.ok) {
        const rendersData = await rendersResponse.json();
        const renderFiles = (rendersData.renders || []).map((render: any) => ({
          fileName: `${render.renderId}.${render.format}`,
          timestamp: render.timestamp,
          type: render.mediaType as 'video' | 'audio' | 'media',
          fileSize: render.fileSize,
          fileExtension: render.format,
          filePath: render.s3Url, // Use S3 URL as file path for downloads
          isRender: true, // Flag to identify renders
          thumbnailPath: render.thumbnailPath || null
        }));

        // Sort by timestamp (newest first)
        renderFiles.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setProjectFiles(renderFiles);
      } else {
        setProjectFiles([]);
      }
    } catch (error) {
      console.error('Error fetching project renders:', error);
      setProjectFiles([]);
    } finally {
      setLoadingProjectFiles(false);
    }
  };

  // Reset files page when filters change
  React.useEffect(() => {
    setCurrentFilesPage(1);
  }, [filesActiveFilter, filesSearchValue, filesDateFilter]);

  // Reset files page when project changes
  React.useEffect(() => {
    setCurrentFilesPage(1);
    setFilesActiveFilter('All');
    setFilesSearchValue('');
    setFilesDateFilter('all');
  }, [selectedProject]);

  React.useEffect(() => {
    fetchUserProjects();
  }, []);

  // Fetch project files when project is selected
  React.useEffect(() => {
    if (selectedProject) {
    fetchProjectFiles(selectedProject.id);
  }
  }, [selectedProject]);

  // Handle project click
  const handleProjectClick = (project: UserProject) => {
    setSelectedProject(project);
    fetchProjectFiles(project.id);
  };

  // Handle back button
  const handleBackToProjects = () => {
    setSelectedProject(null);
    setProjectFiles([]);
    fetchUserProjects();
  };

  React.useEffect(() => {
    const handleRenderCompleted = (event: CustomEvent) => {
      // Refresh projects when a render is completed
      fetchUserProjects();
      
      // If we're currently viewing a project, refresh its files too
      if (selectedProject) {
        fetchProjectFiles(selectedProject.id);
      }
    };

    window.addEventListener('renderCompleted', handleRenderCompleted as EventListener);
    return () => window.removeEventListener('renderCompleted', handleRenderCompleted as EventListener);
  }, [selectedProject]);

  // Handle saving project name
  const handleSaveProjectName = async (project: UserProject) => {
    if (editingName.trim() && editingName !== project.name) {
      const uid = getUidFromUrl();
      try {
        const response = await fetch(`${apiBaseUrl}/save-to-user/update-name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid,
            oldName: project.name,
            newName: editingName.trim(),
            projectId: project.id,
          }),
        });
        
        if (response.ok) {
          // Update the project name in the local state
          setUserProjects(prev => 
            prev.map(p => 
              p.id === project.id 
                ? { ...p, name: editingName.trim() }
                : p
            )
          );
          
          // If this project is selected, update it too
          if (selectedProject?.id === project.id) {
            setSelectedProject(prev => prev ? { ...prev, name: editingName.trim() } : null);
          }

          // Notify the editor to update its project name
          window.dispatchEvent(new CustomEvent('projectNameChanged', { 
            detail: { 
              projectId: project.id,
              oldName: project.name,
              newName: editingName.trim() 
            } 
          }));
        }
      } catch (error) {
        console.error('Error updating project name:', error);
      }
    }
    
    setEditingProject(null);
    setEditingName('');
  };

  const handleDownloadAllRenders = async (project: UserProject) => {
    const uid = getUidFromUrl();
    setDownloadingProject(project.id);
    setDownloadProgress(null);
    
    try {
      // Start the zip creation process
      const startResponse = await fetch(
        `${apiBaseUrl}/save-to-user/download-renders-zip?uid=${uid}&projectId=${project.id}`
      );
      
      if (!startResponse.ok) {
        throw new Error('Failed to start zip creation');
      }
      
      const { jobId } = await startResponse.json();
      
      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(
            `${apiBaseUrl}/save-to-user/download-renders-zip?uid=${uid}&projectId=${project.id}&action=progress`
          );
          
          if (progressResponse.ok) {
            const progress = await progressResponse.json();
            setDownloadProgress(progress);
            
            if (progress.status === 'completed') {
              clearInterval(pollInterval);
              
              // Download the completed zip file
              const downloadUrl = `${apiBaseUrl}/save-to-user/download-renders-zip?uid=${uid}&projectId=${project.id}&action=download`;
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `${project.name}_renders.zip`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Reset states
              setDownloadingProject(null);
              setDownloadProgress(null);
              
            } else if (progress.status === 'error') {
              clearInterval(pollInterval);
              console.error('Zip creation failed:', progress.error);
              setDownloadingProject(null);
              setDownloadProgress(null);
            }
          }
        } catch (error) {
          console.error('Error polling progress:', error);
          clearInterval(pollInterval);
          setDownloadingProject(null);
          setDownloadProgress(null);
        }
      }, 1000); // Poll every second
      
    } catch (error) {
      console.error('Error starting zip download:', error);
      setDownloadingProject(null);
      setDownloadProgress(null);
    }
  };

  // Handle toggling active status
  const handleToggleActiveStatus = async (project: UserProject) => {
    const uid = getUidFromUrl();
    const newStatus = project.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`${apiBaseUrl}/save-to-user/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          projectId: project.id,
          status: newStatus,
        }),
      });
      
      if (response.ok) {
        // Update the project status in the local state
        setUserProjects(prev => 
          prev.map(p => 
            p.id === project.id 
              ? { ...p, status: newStatus }
              : p
          )
        );
        
        // If this project is selected, update it too
        if (selectedProject?.id === project.id) {
          setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null);
        }
        
        // Also trigger event to update corresponding template status
        window.dispatchEvent(new CustomEvent('templateStatusChanged', { 
          detail: { 
            templateName: project.name,
            status: newStatus
          } 
        }));
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  // Pagination logic
  const filteredProjects = userProjects.filter(project => {
    // Status filter
    const statusMatch = activeFilter === 'All' || project.status === 'active';
    
    // Search filter
    const searchMatch = searchValue === '' || 
      project.name.toLowerCase().includes(searchValue.toLowerCase());
    
    // Date filter
    let dateMatch = true;
    if (dateFilter === 'month') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const projectDate = new Date(project.lastSaved || project.createdAt);
      dateMatch = projectDate >= startOfMonth && projectDate <= endOfMonth;
    } else if (dateFilter === 'custom') {
      const projectDate = new Date(project.lastSaved || project.createdAt);
      dateMatch = projectDate >= customDateRange.start && projectDate <= customDateRange.end;
    }
    // For 'all', dateMatch remains true
    
    return statusMatch && searchMatch && dateMatch;
  });
  
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePrevious = () => {
    if (totalPages > 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (totalPages > 1 && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside of any menu
      if (!target.closest('[data-menu]')) {
        setMenuOpen(null);
      }
    };
    
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  // Listen for project save events
  React.useEffect(() => {
    const handleProjectSaved = (event: CustomEvent) => {
      // Refresh projects when a project is saved
      fetchUserProjects();
    };

    window.addEventListener('projectSaved', handleProjectSaved as EventListener);
    return () => window.removeEventListener('projectSaved', handleProjectSaved as EventListener);
  }, []);

  // Listen for template status changes
  React.useEffect(() => {
    const handleProjectStatusChanged = (event: CustomEvent) => {
      const { projectName, status } = event.detail;
      
      // Update the project status in local state
      setUserProjects(prev => 
        prev.map(project => 
          project.name === projectName 
            ? { ...project, status: status }
            : project
        )
      );
    };

    window.addEventListener('projectStatusChanged', handleProjectStatusChanged as EventListener);
    return () => window.removeEventListener('projectStatusChanged', handleProjectStatusChanged as EventListener);
  }, []);

  React.useEffect(() => {
    const handleTemplateLoadingComplete = (event: CustomEvent) => {
      const { projectId } = event.detail || {};
      
      // Clear applying state and show success
      setApplyingTemplate(null);
      setTemplateApplied(projectId);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setTemplateApplied(null);
      }, 2000);
    };

    window.addEventListener('templateLoadingComplete', handleTemplateLoadingComplete as EventListener);
    return () => window.removeEventListener('templateLoadingComplete', handleTemplateLoadingComplete as EventListener);
  }, []);

  const handleApplyTemplate = async (project: UserProject) => {
    const uid = getUidFromUrl();
    
    // Set applying state
    setApplyingTemplate(project.id);
    
    try {
      // Get the latest save file for this project
      const response = await fetch(`${apiBaseUrl}/save-to-user/get-project-data?uid=${uid}&projectName=${project.name}`);
      if (response.ok) {
        const data = await response.json();
        if (data.projectData) {
          // Create a template object from the project data
          const template = {
            id: `project-template-${Date.now()}`,
            name: project.name,
            description: "Template from saved project",
            createdAt: project.createdAt,
            updatedAt: project.lastUpdated,
            createdBy: { id: "user", name: "User" },
            category: "Custom",
            tags: ["custom", "saved-project"],
            duration: data.projectData.durationInFrames || 30 * 30, // Default to 30 seconds at 30fps
            aspectRatio: data.projectData.aspectRatio || "16:9",
            overlays: data.projectData.overlays || []
          };
          
          // Dispatch event to load template into editor
          window.dispatchEvent(new CustomEvent('applyTemplate', { 
            detail: { template, projectId: project.id } 
          }));
        }
      }
    } catch (error) {
      console.error('Error loading project template:', error);
      // Clear applying state on error
      setApplyingTemplate(null);
    }
  };

  return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col xs:flex-row xs:items-start justify-between mb-4 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl xs:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Your Saved Projects
              </h1>
              <p className="text-gray-600 text-sm xs:text-base lg:text-lg">
                Effortlessly Manage and Edit Your Creative Canvas Projects Anytime
              </p>
            </div>
            
            {/* Conditional Buttons */}
            {selectedProject ? (
              /* Back Button when inside project */
              <Button
                onClick={handleBackToProjects}
                variant="outline"
                className="px-6 py-2 rounded-lg font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-2 select-none"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Projects
              </Button>
            ) : (
              <div className="flex border rounded-lg overflow-hidden flex-shrink-0 self-start">
                <Button
                  variant="ghost"
                  onClick={() => setActiveFilter('Active')}
                  className={`px-2 xs:px-4 py-[10px] rounded-l-lg rounded-r-none font-medium text-xs xs:text-sm select-none ${
                    activeFilter === 'Active'
                      ? 'bg-[rgb(41,0,156)]/15 text-[rgb(41,0,156)] border border-[rgb(41,0,156)] hover:bg-[rgb(41,0,156)]/15'
                      : 'bg-white text-[rgb(65,77,92)] border border-[rgb(135,133,133)] hover:bg-gray-50'
                  }`}
                >
                  <span className="hidden xs:inline">Active View</span>
                  <span className="xs:hidden">Active</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveFilter('All')}
                  className={`px-2 xs:px-4 py-[10px] rounded-l-none rounded-r-lg font-medium text-xs xs:text-sm select-none ${
                    activeFilter === 'All'
                      ? 'bg-[rgb(41,0,156)]/15 text-[rgb(41,0,156)] border border-[rgb(41,0,156)] hover:bg-[rgb(41,0,156)]/15'
                      : 'bg-white text-[rgb(65,77,92)] border border-[rgb(135,133,133)] hover:bg-gray-50'
                  }`}
                >
                  All
                </Button>
              </div>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[#490972] font-semibold font-medium hover:text-[#3d075f]">
              Your Saved Projects
            </span>
            {selectedProject && (
              <>
                <ChevronRight className="w-4 h-4 text-[#490972]" />
                <span className="text-gray-900 font-medium">
                  {selectedProject.name}
                </span>
              </>
            )}
          </div>

          {/* Controls Row - Only show when viewing projects list */}
          {!selectedProject && !loading && userProjects.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              {/* Date Selector */}
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      className="min-w-32 xs:min-w-52 max-w-full xs:max-w-80 bg-white border-gray-300 justify-between text-left font-normal text-gray-900 text-xs xs:text-sm"
                    >
                    <span className="truncate">
                      {getDateFilterDisplay()}
                    </span>
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    {/* Left sidebar with options */}
                    <div className="w-32 border-r bg-gray-50">
                      <div 
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${dateFilter === 'all' ? 'bg-blue-500 text-white' : ''}`}
                        onClick={() => {
                          setDateFilter('all');
                          setShowDatePicker(false);
                        }}
                      >
                        All
                      </div>
                      <div 
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${dateFilter === 'month' ? 'bg-blue-500 text-white' : ''}`}
                        onClick={() => {
                          setDateFilter('month');
                          setShowDatePicker(false);
                        }}
                      >
                        This Month
                      </div>
                      <div 
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${dateFilter === 'custom' ? 'bg-blue-500 text-white' : ''}`}
                        onClick={() => {
                          setDateFilter('custom');
                          // Don't close popover immediately for custom range
                        }}
                      >
                        Custom Range
                      </div>
                    </div>
                    
                    {/* Calendar section - only show when custom is selected */}
                    {dateFilter === 'custom' && (
                      <div className="p-4 bg-white">
                        {/* Show SimpleDatePicker on mobile/tablet, DateRangeCalendar on desktop */}
                        <div className="block lg:hidden">
                          <SimpleDatePicker 
                            startDate={customDateRange.start}
                            endDate={customDateRange.end}
                            onDateChange={(start, end) => {
                              setCustomDateRange({ start, end });
                            }}
                            onApply={() => {
                              setShowDatePicker(false);
                            }}
                            onCancel={() => {
                              setShowDatePicker(false);
                            }}
                          />
                        </div>
                        <div className="hidden lg:block">
                          <DateRangeCalendar 
                            startDate={customDateRange.start}
                            endDate={customDateRange.end}
                            onDateChange={(start, end) => {
                              setCustomDateRange({ start, end });
                            }}
                            onApply={() => {
                              setShowDatePicker(false);
                            }}
                            onCancel={() => {
                              setShowDatePicker(false);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Search */}
              <div className="flex items-center gap-3">
                {/* Desktop/Tablet Search */}
                <div className="hidden cards-2:flex items-center gap-3">
                  <label htmlFor="search" className="text-gray-700 font-medium select-none">
                    Search
                  </label>
                  <Input
                    id="search"
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-60 cards-3:w-80 bg-white border-gray-300 text-gray-900"
                    placeholder=""
                    autoComplete="off"
                  />
                </div>
                
                {/* Mobile Search Icon */}
                <button
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                  className="cards-2:hidden flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-md"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {/* Mobile Search Bar */}
          {!selectedProject && !loading && userProjects.length > 0 && showMobileSearch && (
            <div className="cards-2:hidden mt-4">
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-white border-gray-300 text-gray-900"
                placeholder="Search projects..."
                autoComplete="off"
              />
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="mb-8 relative">
          {loading ? (
            <div className="text-center py-8 select-none">Loading projects...</div>
          ) : selectedProject ? (
            /* Project Files View */
            <div>
              {/* Controls Row for Files */}
              {projectFiles.length > 0 && (
                <div className="flex items-center justify-between gap-4 mb-6">
                  {/* Date Selector for Files */}
                  <Popover open={showFilesDatePicker} onOpenChange={setShowFilesDatePicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-w-52 max-w-80 bg-white border-gray-300 justify-between text-left font-normal text-gray-900"
                      >
                        <span className="truncate">
                          {getFilesDateFilterDisplay()}
                        </span>
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="flex">
                        {/* Left sidebar with options */}
                        <div className="w-32 border-r bg-gray-50">
                          <div 
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${filesDateFilter === 'all' ? 'bg-blue-500 text-white' : ''}`}
                            onClick={() => {
                              setFilesDateFilter('all');
                              setShowFilesDatePicker(false);
                            }}
                          >
                            All
                          </div>
                          <div 
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${filesDateFilter === 'month' ? 'bg-blue-500 text-white' : ''}`}
                            onClick={() => {
                              setFilesDateFilter('month');
                              setShowFilesDatePicker(false);
                            }}
                          >
                            This Month
                          </div>
                          <div 
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${filesDateFilter === 'custom' ? 'bg-blue-500 text-white' : ''}`}
                            onClick={() => {
                              setFilesDateFilter('custom');
                              // Don't close popover immediately for custom range
                            }}
                          >
                            Custom Range
                          </div>
                        </div>
                        
                        {/* Calendar section - only show when custom is selected */}
                        {filesDateFilter === 'custom' && (
                          <div className="p-4 bg-white">
                            {/* Show SimpleDatePicker on mobile/tablet, DateRangeCalendar on desktop */}
                            <div className="block lg:hidden">
                              <SimpleDatePicker 
                                startDate={filesCustomDateRange.start}
                                endDate={filesCustomDateRange.end}
                                onDateChange={(start, end) => {
                                  setFilesCustomDateRange({ start, end });
                                }}
                                onApply={() => {
                                  setShowFilesDatePicker(false);
                                }}
                                onCancel={() => {
                                  setShowFilesDatePicker(false);
                                }}
                              />
                            </div>
                            <div className="hidden lg:block">
                              <DateRangeCalendar 
                                startDate={filesCustomDateRange.start}
                                endDate={filesCustomDateRange.end}
                                onDateChange={(start, end) => {
                                  setFilesCustomDateRange({ start, end });
                                }}
                                onApply={() => {
                                  setShowFilesDatePicker(false);
                                }}
                                onCancel={() => {
                                  setShowFilesDatePicker(false);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Search for Files */}
                  <div className="flex items-center gap-3">
                    {/* Desktop/Tablet Search */}
                    <div className="hidden cards-2:flex items-center gap-3">
                      <label htmlFor="files-search" className="text-gray-700 font-medium select-none">
                        Search
                      </label>
                      <Input
                        id="files-search"
                        type="text"
                        value={filesSearchValue}
                        onChange={(e) => setFilesSearchValue(e.target.value)}
                        className="w-60 cards-3:w-80 bg-white border-gray-300 text-gray-900"
                        placeholder=""
                        autoComplete="off"
                      />
                    </div>
                    
                    {/* Mobile Search Icon */}
                    <button
                      onClick={() => setShowMobileSearch(!showMobileSearch)}
                      className="cards-2:hidden flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-md select-none"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Files Grid */}
              <div className="grid grid-cols-1 cards-2:grid-cols-2 cards-3:grid-cols-3 cards-4:grid-cols-4 gap-3 cards-4:gap-2 max-w-full items-center justify-center px-2 cards-4:px-1 select-none">
                {(() => {
                  // Apply filters to files
                  const filteredFiles = projectFiles.filter(file => {
                    // Type filter (All means show all types)
                    const typeMatch = filesActiveFilter === 'All' || 
                      (filesActiveFilter === 'Video' && file.type === 'video') ||
                      (filesActiveFilter === 'Audio' && file.type === 'audio');
                    
                    // Search filter
                    const searchMatch = filesSearchValue === '' || 
                      file.fileName.toLowerCase().includes(filesSearchValue.toLowerCase());
                    
                    // Date filter
                    let dateMatch = true;
                    if (filesDateFilter === 'month') {
                      const now = new Date();
                      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      const fileDate = new Date(file.timestamp);
                      dateMatch = fileDate >= startOfMonth && fileDate <= endOfMonth;
                    } else if (filesDateFilter === 'custom') {
                      const fileDate = new Date(file.timestamp);
                      dateMatch = fileDate >= filesCustomDateRange.start && fileDate <= filesCustomDateRange.end;
                    }
                    
                    return typeMatch && searchMatch && dateMatch;
                  });

                  const startIndex = (currentFilesPage - 1) * filesPerPage;
                  const endIndex = startIndex + filesPerPage;
                  const currentFiles = filteredFiles.slice(startIndex, endIndex);
                  
                  return currentFiles.length > 0 ? currentFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col w-[255px] bg-white rounded-xl cursor-pointer transition-shadow relative"
                      style={{ boxShadow: '4px 4px 40px 0 rgba(0, 0, 0, 0.25)' }}
                    >
                      {/* File Thumbnail */}
                      <div className="h-48 bg-gray-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                        {file.thumbnailPath ? (
                          <img
                            src={`${apiBaseUrl}/user-files/${getUidFromUrl()}/${selectedProject?.id}/${file.thumbnailPath}`}
                            alt={file.fileName}
                            className="w-full h-full object-cover"
                            onLoad={() => {
                            }}
                            onError={(e) => {
                              
                              // Fallback to icon if thumbnail fails
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const container = img.parentElement;
                              if (container) {
                                const iconHtml = file.type === 'video' 
                                  ? `<div class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                       <div class="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                                         <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                           <path d="M8 5v14l11-7z"/>
                                         </svg>
                                       </div>
                                     </div>`
                                  : `<div class="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                                       <div class="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                                         <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                           <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                         </svg>
                                       </div>
                                     </div>`;
                                container.innerHTML = iconHtml;
                              }
                            }}
                          />
                        ) : file.type === 'video' ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                              </svg>
                            </div>
                          </div>
                        )}
                        
                        {/* File extension badge */}
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded uppercase">
                          {file.fileExtension}
                        </div>
                        {/* Render badge */}
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          RENDER
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="p-4 flex flex-col h-32">
                        <h3 className="font-semibold text-gray-900 text-sm truncate flex-1 mb-1">
                          {file.fileName.length > 20 ? file.fileName.substring(0, 17) + '...' : file.fileName}
                        </h3>
                        
                        <p className="text-gray-500 text-xs mb-3">
                          {new Date(file.timestamp).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>

                        {/* Bottom section */}
                        <div className="flex items-center justify-between mt-auto">
                          <button 
                            onClick={() => {
                              // Download directly from S3 URL
                              const link = document.createElement('a');
                              link.href = file.filePath; // This is the S3 URL
                              link.download = file.fileName;
                              link.target = '_blank';
                              link.click();
                            }}
                            className="w-6 h-6 flex items-center justify-center"
                            title="Download render"
                          >
                            <Download className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : loadingProjectFiles ? (
                    <div className="col-span-4 w-full flex items-center justify-center py-12 select-none">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3 mx-auto"></div>
                        <div className="text-gray-500 text-lg mb-2">Loading renders...</div>
                        <div className="text-gray-400 text-sm">Please wait while we fetch your project files</div>
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-4 w-full flex items-center justify-center py-12 select-none">
                      <div className="text-center">
                        <div className="text-gray-500 text-lg mb-2">No renders found</div>
                        <div className="text-gray-400 text-sm">
                          {filesSearchValue !== '' && `No renders match "${filesSearchValue}"`}
                          {filesSearchValue !== '' && filesDateFilter !== 'all' && ' with the selected date range'}
                          {filesSearchValue === '' && filesDateFilter !== 'all' && 'No renders found in the selected date range'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* {projectFiles.length === 0 && (
                  <div className="col-span-4 w-full text-center py-12 text-gray-500">
                    No rendered files in this project yet
                  </div>
                )} */}
              </div>
              
              {/* Files Pagination */}
              {(() => {
                const filteredFiles = projectFiles.filter(file => {
                  const typeMatch = filesActiveFilter === 'All' || 
                    (filesActiveFilter === 'Video' && file.type === 'video') ||
                    (filesActiveFilter === 'Audio' && file.type === 'audio');
                  
                  const searchMatch = filesSearchValue === '' || 
                    file.fileName.toLowerCase().includes(filesSearchValue.toLowerCase());
                  
                  let dateMatch = true;
                  if (filesDateFilter === 'month') {
                    const now = new Date();
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    const fileDate = new Date(file.timestamp);
                    dateMatch = fileDate >= startOfMonth && fileDate <= endOfMonth;
                  } else if (filesDateFilter === 'custom') {
                    const fileDate = new Date(file.timestamp);
                    dateMatch = fileDate >= filesCustomDateRange.start && fileDate <= filesCustomDateRange.end;
                  }
                  
                  return typeMatch && searchMatch && dateMatch;
                });

                const totalFilesPages = Math.ceil(filteredFiles.length / filesPerPage);
                const startIndex = (currentFilesPage - 1) * filesPerPage;
                const endIndex = startIndex + filesPerPage;

                return filteredFiles.length > 0 ? (
                  <div className="flex items-center justify-between mt-8">
                    {/* Showing entries text */}
                    <p className="text-gray-600">
                      Showing {filteredFiles.length === 0 ? '0-0' : `${startIndex + 1}-${Math.min(endIndex, filteredFiles.length)}`} of {filteredFiles.length} renders
                    </p>

                    {/* Pagination */}
                    <div className="flex items-center flex-wrap justify-center xs:justify-start select-none">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (totalFilesPages > 1 && currentFilesPage > 1) {
                            setCurrentFilesPage(currentFilesPage - 1);
                          }
                        }}
                        className="cursor-pointer border-[0.8px] border-[#878585] bg-transparent overflow-hidden flex items-center justify-start px-[6px] xs:px-[10px] py-[5.5px] text-gray-600 rounded-none text-xs xs:text-sm whitespace-nowrap"
                      >
                        <span className="hidden xs:inline">Previous</span>
                        <span className="xs:hidden">Prev</span>
                      </Button>
                      
                      {/* Page numbers */}
                      {(() => {
                        const getVisiblePages = () => {
                          const width = window.innerWidth;
                          let maxVisible;
                          
                          if (width < 640) {
                            maxVisible = 3; // Mobile: show 3 pages
                          } else if (width < 1024) {
                            maxVisible = 5; // Tablet: show 5 pages
                          } else {
                            maxVisible = 5; // Desktop: show 5 pages
                          }
                          
                          if (totalFilesPages <= maxVisible) {
                          return Array.from({ length: totalFilesPages }, (_, i) => i + 1);
                        }
                        
                        const half = Math.floor(maxVisible / 2);
                        let start = Math.max(1, currentFilesPage - half);
                        let end = Math.min(totalFilesPages, start + maxVisible - 1);
                        
                        if (end - start + 1 < maxVisible) {
                          start = Math.max(1, end - maxVisible + 1);
                        }
                        
                        const pages = [];
                        
                        // Always show first page
                        if (start > 1) {
                          pages.push(1);
                          if (start > 2) {
                            pages.push('...');
                          }
                        }
                        
                        // Show middle pages
                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }
                        
                        // Always show last page
                        if (end < totalFilesPages) {
                          if (end < totalFilesPages - 1) {
                            pages.push('...');
                          }
                          pages.push(totalFilesPages);
                        }
                          
                          return pages;
                        };
                        
                        return getVisiblePages().map((page, index) => (
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-600">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={page}
                              variant="outline"
                              onClick={() => setCurrentFilesPage(page as number)}
                              className={`px-1 xs:px-2 sm:px-4 py-1 xs:py-2 rounded-none border-[rgb(135,133,133)] text-xs xs:text-sm min-w-[32px] xs:min-w-[40px] ${
                              currentFilesPage === page
                                ? 'bg-[#f4f2fa] text-[#490972] shadow-[inset_-1px_-2px_8px_rgba(41,0,156,0.25)] border-t-[0.8px] border-b-[0.8px] border-t-[rgb(135,133,133)] border-b-[rgb(135,133,133)]'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            >
                              {page}
                            </Button>
                          )
                        ));
                      })()}
                      
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (totalFilesPages > 1 && currentFilesPage < totalFilesPages) {
                            setCurrentFilesPage(currentFilesPage + 1);
                          }
                        }}
                        className="cursor-pointer border-[0.8px] border-[#878585] bg-transparent overflow-hidden flex items-center justify-start px-[6px] xs:px-[10px] py-[5.5px] text-gray-600 rounded-none text-xs xs:text-sm whitespace-nowrap"
                      >
                        <span className="hidden xs:inline">Next</span>
                        <span className="xs:hidden">Next</span>
                      </Button>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <>
              {currentProjects.length === 0 && userProjects.length > 0 && (searchValue !== '' || dateFilter !== 'all') && (
                <div className="w-full flex items-center justify-center py-12 select-none items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-500 text-lg mb-2">No projects found</div>
                    <div className="text-gray-400 text-sm">
                      {searchValue !== '' && `No projects match "${searchValue}"`}
                      {searchValue !== '' && dateFilter !== 'all' && ' with the selected date range'}
                      {searchValue === '' && dateFilter !== 'all' && 'No projects found in the selected date range'}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 cards-2:grid-cols-2 cards-3:grid-cols-3 cards-4:grid-cols-4 gap-3 cards-4:gap-2 max-w-full items-center justify-center px-2 cards-4:px-1">
                {/* Show "Start Generating" card only when there are truly no projects and no active search/filter */}
                {currentProjects.length === 0  && searchValue === '' && dateFilter === 'all' && (
                  <div className="flex flex-col w-[255px] bg-white rounded-xl cursor-pointer transition-shadow relative"
                    style={{ boxShadow: '4px 4px 40px 0 rgba(0, 0, 0, 0.25)' }}
                  >
                    <div className="flex flex-col gap-[10px] m-2 py-[90px] px-0 rounded-xl border-dashed border border-[#29009c]"
                      style={{ outlineOffset: '-1px' }}
                    >
                      <div className="flex justify-center items-center text-[#490972] text-center"
                        style={{ font: '50 64px / 0.69 Poppins, Helvetica, Arial, serif' }}
                      >
                        +
                      </div>
                      <div className="flex justify-center items-center text-[#490972] text-center"
                        style={{ font: '600 16px / 1.5 Poppins, Helvetica, Arial, serif' }}
                      >
                        Start Generating
                      </div>
                    </div>
                  </div>
                )}

                {/* User Projects */}
                {currentProjects.map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => handleProjectClick(project)}
                    className="flex flex-col w-[255px] bg-white rounded-xl cursor-pointer transition-shadow relative"
                    style={{ boxShadow: '4px 4px 40px 0 rgba(0, 0, 0, 0.25)' }}
                  >
                    {/* Translucent overlay for inactive projects */}
                    {project.status !== 'active' && (
                      <div className="absolute inset-0 bg-white/70 rounded-xl z-10 pointer-events-none"></div>
                    )}
                    {/* Folder Icon/Thumbnail */}
                    <div className="h-48 bg-[rgb(41,0,156)]/15 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                      <div className="w-20 h-16 bg-yellow-400 rounded-lg shadow-lg flex items-center justify-center relative">
                        <div className="w-16 h-12 bg-yellow-500 rounded-md"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-3 bg-yellow-300 rounded-tr-lg rounded-bl-lg"></div>
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="p-4 flex flex-col h-32">
                      <div className="flex items-center gap-2 mb-1">
                        {editingProject === project.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleSaveProjectName(project)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveProjectName(project);
                              } else if (e.key === 'Escape') {
                                setEditingProject(null);
                                setEditingName('');
                              }
                            }}
                            className="font-semibold text-gray-900 text-sm bg-transparent border-b border-gray-300 focus:outline-none focus:border-purple-500 flex-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                            {project.name}
                          </h3>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project.id);
                            setEditingName(project.name);
                          }}
                          className="w-4 h-4 flex items-center justify-center hover:bg-gray-100 rounded"
                        >
                          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                      
                      <p className="text-gray-500 text-xs mb-3 select-none">
                        {project.lastSaved ? new Date(project.lastSaved).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'Never'}
                      </p>

                      {/* Bottom section */}
                      {/* <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadAllRenders(project);
                            }}
                            disabled={downloadingProject === project.id}
                            className={`w-6 h-6 flex items-center justify-center ${
                              downloadingProject === project.id ? 'cursor-not-allowed' : ''
                            }`}
                            title={
                              downloadingProject === project.id 
                                ? downloadProgress?.message || 'Processing...'
                                : 'Download all renders'
                            }
                          >
                            {downloadingProject === project.id ? (
                              <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Download className="w-5 h-5 text-gray-600" />
                            )}
                          </button> 
                          {downloadingProject === project.id && downloadProgress && (
                            <div className="absolute -bottom-8 left-0 right-0 bg-white rounded border shadow-sm p-2 z-20">
                              <div className="text-xs text-gray-600 mb-1">
                                {downloadProgress.message}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${(downloadProgress.current / downloadProgress.total) * 100}%` 
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {downloadProgress.current}/{downloadProgress.total}
                              </div>
                            </div>
                          )}              
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyTemplate(project);
                            }}
                            disabled={applyingTemplate === project.id || templateApplied === project.id}
                            className={`px-2 py-1 text-xs rounded transition-colors select-none flex items-center gap-1 ${
                              applyingTemplate === project.id
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : templateApplied === project.id
                                ? 'bg-green-500 text-white'
                                : 'bg-[#490972] hover:bg-[#490972] text-white'
                            }`}
                            title={
                              applyingTemplate === project.id
                                ? 'Applying template...'
                                : templateApplied === project.id
                                ? 'Template applied successfully'
                                : 'Apply as template'
                            }
                          >
                            {applyingTemplate === project.id ? (
                              <>
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                Applying...
                              </>
                            ) : templateApplied === project.id ? (
                              <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Applied
                              </>
                            ) : (
                              'Apply Template'
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 select-none">
                            {project.renders?.length || 0} renders
                          </span>
                          
                          {/* Three dots menu */}
                          {/* <div className="relative z-10" data-menu>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(menuOpen === project.id ? null : project.id);
                              }}
                              className="w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                            </button> */}
                            
                            {/* Dropdown menu */}
                            {/* {menuOpen === project.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 whitespace-nowrap min-w-max">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleActiveStatus(project);
                                    setMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 block select-none"
                                >
                                  {project.status === 'active' ? 'Hide From Active View' : 'Show in Active View'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div> */}

                      {/* Bottom section */}
                      {downloadingProject === project.id && downloadProgress ? (
                        /* Progress view */
                        <div className="w-full mt-auto">
                          <div className="text-xs text-gray-600 mb-2">
                            {downloadProgress.message}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(downloadProgress.current / downloadProgress.total) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {downloadProgress.current}/{downloadProgress.total}
                          </div>
                        </div>
                      ) : (
                        /* Normal view */
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadAllRenders(project);
                              }}
                              className="w-6 h-6 flex items-center justify-center"
                              title="Download all renders"
                            >
                              <Download className="w-5 h-5 text-gray-600" />
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyTemplate(project);
                              }}
                              disabled={applyingTemplate === project.id || templateApplied === project.id}
                              className={`px-2 py-1 text-xs rounded transition-colors select-none flex items-center gap-1 ${
                                applyingTemplate === project.id
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : templateApplied === project.id
                                  ? 'bg-green-500 text-white'
                                  : 'bg-[#490972] hover:bg-[#490972] text-white'
                              }`}
                              title={
                                applyingTemplate === project.id
                                  ? 'Applying template...'
                                  : templateApplied === project.id
                                  ? 'Template applied successfully'
                                  : 'Apply as template'
                              }
                            >
                              {applyingTemplate === project.id ? (
                                <>
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  Applying...
                                </>
                              ) : templateApplied === project.id ? (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Applied
                                </>
                              ) : (
                                'Apply Template'
                              )}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 select-none">
                              {project.renders?.length || 0} renders
                            </span>
                            
                            {/* Three dots menu */}
                            <div className="relative z-10" data-menu>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpen(menuOpen === project.id ? null : project.id);
                                }}
                                className="w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                              </button>
                              
                              {/* Dropdown menu */}
                              {menuOpen === project.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 whitespace-nowrap min-w-max">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleActiveStatus(project);
                                      setMenuOpen(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 block select-none"
                                  >
                                    {project.status === 'active' ? 'Hide From Active View' : 'Show in Active View'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer - Always show when viewing projects list */}
        {!selectedProject && !loading && (
          <div className="flex flex-col xs:flex-row items-center justify-between gap-4 select-none">
            {/* Showing entries text */}
            <p className="text-gray-600">
              Showing {filteredProjects.length === 0 ? '0-0' : `${startIndex + 1}-${Math.min(endIndex, filteredProjects.length)}`} of {filteredProjects.length} entries
            </p>

            {/* Pagination */}
            <div className="flex items-center flex-wrap justify-center xs:justify-start select-none">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                className="cursor-pointer border-[0.8px] border-[#878585] bg-transparent overflow-hidden flex items-center justify-start px-[6px] xs:px-[10px] py-[5.5px] text-gray-600 rounded-none text-xs xs:text-sm whitespace-nowrap"
              >
                <span className="hidden xs:inline">Previous</span>
                <span className="xs:hidden">Prev</span>
              </Button>
              
              {/* Page numbers */}
              {(() => {
                const getVisiblePages = () => {
                  const width = window.innerWidth;
                  let maxVisible;
                  
                  if (width < 640) {
                    maxVisible = 3; // Mobile: show 3 pages
                  } else if (width < 1024) {
                    maxVisible = 5; // Tablet: show 5 pages
                  } else {
                    maxVisible = 5; // Desktop: show 7 pages
                  }
                  
                  if (totalPages <= maxVisible) {
                    return Array.from({ length: totalPages }, (_, i) => i + 1);
                  }
                  
                  const half = Math.floor(maxVisible / 2);
                  let start = Math.max(1, currentPage - half);
                  let end = Math.min(totalPages, start + maxVisible - 1);
                  
                  if (end - start + 1 < maxVisible) {
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  
                  const pages = [];
                  
                  // Always show first page
                  if (start > 1) {
                    pages.push(1);
                    if (start > 2) {
                      pages.push('...');
                    }
                  }
                  
                  // Show middle pages
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  
                  // Always show last page
                  if (end < totalPages) {
                    if (end < totalPages - 1) {
                      pages.push('...');
                    }
                    pages.push(totalPages);
                  }
                  
                  return pages;
                };
                
                return getVisiblePages().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-600">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant="outline"
                      onClick={() => handlePageChange(page as number)}
                      className={`px-1 xs:px-2 sm:px-4 py-1 xs:py-2 rounded-none border-[rgb(135,133,133)] text-xs xs:text-sm min-w-[32px] xs:min-w-[40px] ${
                      currentPage === page
                        ? 'bg-[#f4f2fa] text-[#490972] shadow-[inset_-1px_-2px_8px_rgba(41,0,156,0.25)] border-t-[0.8px] border-b-[0.8px] border-t-[rgb(135,133,133)] border-b-[rgb(135,133,133)]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    >
                      {page}
                    </Button>
                  )
                ));
              })()}
              
              <Button
                variant="ghost"
                onClick={handleNext}
                className="cursor-pointer border-[0.8px] border-[#878585] bg-transparent overflow-hidden flex items-center justify-start px-[6px] xs:px-[10px] py-[5.5px] text-gray-600 rounded-none text-xs xs:text-sm whitespace-nowrap"
              >
                <span className="hidden xs:inline">Next</span>
                <span className="xs:hidden">Next</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}