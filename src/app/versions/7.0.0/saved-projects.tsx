'use client';

import React, { useState } from 'react';
import { ChevronRight, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    <div className="flex gap-4">
      {/* First Calendar */}
      <div className="w-64">
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
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
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
                p-2 text-sm hover:bg-blue-100 rounded
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

      {/* Second Calendar */}
      <div className="w-64">
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
      <div className="flex flex-col justify-end">
        <div className="flex flex-col gap-2">
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
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 projects per page (2 rows of 3)
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

  // Get UID from URL
  const getUidFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid') || 'default';
  };

  // Fetch user projects
  const fetchUserProjects = async () => {
    const uid = getUidFromUrl();
    try {
      const response = await fetch(`/api/latest/save-to-user/get?uid=${uid}`);
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

  // Fetch project files for selected project
  const fetchProjectFiles = async (projectId: string) => {
    const uid = getUidFromUrl();
    try {
      const response = await fetch(`/api/latest/save-to-user/get-files?uid=${uid}&projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching project files:', error);
    }
  };

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

  // Handle saving project name
  const handleSaveProjectName = async (project: UserProject) => {
    if (editingName.trim() && editingName !== project.name) {
      const uid = getUidFromUrl();
      try {
        const response = await fetch('/api/latest/save-to-user/update-name', {
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

  // Handle downloading project (latest render)
  const handleDownloadProject = async (project: UserProject) => {
    const uid = getUidFromUrl();
    try {
      const response = await fetch(`/api/latest/save-to-user/get-files?uid=${uid}&projectId=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        const files = data.files || [];
        
        if (files.length > 0) {
          // Download the most recent file
          const latestFile = files[0];
          const link = document.createElement('a');
          link.href = `/api/latest/download-file?filePath=${encodeURIComponent(latestFile.filePath)}`;
          link.download = latestFile.fileName;
          link.click();
        }
      }
    } catch (error) {
      console.error('Error downloading project:', error);
    }
  };

  // Handle toggling active status
  const handleToggleActiveStatus = async (project: UserProject) => {
    const uid = getUidFromUrl();
    const newStatus = project.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch('/api/latest/save-to-user/update-status', {
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
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  // Pagination logic
  // const filteredProjects = userProjects.filter(project => 
  //   activeFilter === 'All' || project.status === 'active'
  // );
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

  return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Your Saved Projects
              </h1>
              <p className="text-gray-600 text-lg">
                Effortlessly Manage and Edit Your Creative Canvas Projects Anytime
              </p>
            </div>
            
            {/* Conditional Buttons */}
            {selectedProject ? (
              /* Back Button when inside project */
              <Button
                onClick={handleBackToProjects}
                variant="outline"
                className="px-6 py-2 rounded-lg font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Projects
              </Button>
            ) : (
              /* Filter Buttons when viewing projects list */
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  onClick={() => setActiveFilter('Active')}
                  className={`px-4 py-[10px] rounded-l-lg rounded-r-none font-medium ${
                    activeFilter === 'Active'
                      ? 'bg-[rgb(41,0,156)]/15 text-[rgb(41,0,156)] border border-[rgb(41,0,156)] hover:bg-[rgb(41,0,156)]/15'
                      : 'bg-white text-[rgb(65,77,92)] border border-[rgb(135,133,133)] hover:bg-gray-50'
                  }`}
                >
                  Active View
                </Button>
                {/* <div className="w-px bg-[rgb(41,0,156)]"></div> */}
                <Button
                  variant="ghost"
                  onClick={() => setActiveFilter('All')}
                  className={`px-4 py-[10px] rounded-l-none rounded-r-lg font-medium  ${
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
            <span className="text-[#490972] font-semibold font-medium cursor-pointer hover:text-[#3d075f]">
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
                    className="min-w-52 max-w-80  bg-white border-gray-300 justify-between text-left font-normal text-gray-900"
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
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Search */}
              <div className="flex items-center gap-3">
                <label htmlFor="search" className="text-gray-700 font-medium">
                  Search
                </label>
                <Input
                  id="search"
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-80 bg-white border-gray-300 text-gray-900"
                  placeholder=""
                  autoComplete="off"
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="mb-8 relative">
          {loading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : selectedProject ? (
            /* Project Files View */
            <div>
              {/* Project Header */}
              <div className="mb-6">
                <p className="text-gray-600">
                </p>
              </div>

              {/* Files Grid */}
              <div className="flex flex-wrap gap-6">
                {projectFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow relative"
                    style={{ width: '280px', height: '320px' }}
                  >
                    {/* File Thumbnail */}
                    <div className="h-48 bg-gray-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                      {file.type === 'video' ? (
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
                    </div>

                    {/* File Info */}
                    <div className="p-4 flex flex-col h-32">
                      <h3 className="font-semibold text-gray-900 text-sm truncate mb-1" title={file.fileName}>
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
                            const link = document.createElement('a');
                            link.href = `/api/latest/download-file?filePath=${encodeURIComponent(file.filePath)}`;
                            link.download = file.fileName;
                            link.click();
                          }}
                          className="w-6 h-6 flex items-center justify-center"
                        >
                          <Download className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-1 text-yellow-600">
                          <span className="text-xs">💰</span>
                          <span className="text-xs font-medium">
                            {Math.round(file.fileSize / (1024 * 1024))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {projectFiles.length === 0 && (
                  <div className="w-full text-center py-12 text-gray-500">
                    No media files in this project yet
                  </div>
                )}
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl items-center justify-center">
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
                  // className="bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow relative"
                  className="flex flex-col w-[255px] bg-white rounded-xl cursor-pointer transition-shadow relative"
                  style={{ boxShadow: '4px 4px 40px 0 rgba(0, 0, 0, 0.25)' }}
                >
                  {/* Folder Icon/Thumbnail */}
                  <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-200 rounded-t-xl flex items-center justify-center relative overflow-hidden">
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
                    
                    <p className="text-gray-500 text-xs mb-3">
                      {project.lastSaved ? new Date(project.lastSaved).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : 'Never'}
                    </p>

                    {/* Bottom section */}
                    <div className="flex items-center justify-between mt-auto">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadProject(project);
                        }}
                        className="w-6 h-6 flex items-center justify-center"
                      >
                        <Download className="w-5 h-5 text-gray-600" />
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
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
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 block"
                              >
                                {project.status === 'active' ? 'Hide From Active View' : 'Show in Active View'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>

        {/* Footer - Always show when viewing projects list */}
        {!selectedProject && !loading && (
          <div className="flex items-center justify-between">
            {/* Showing entries text */}
            <p className="text-gray-600">
              Showing {filteredProjects.length === 0 ? '0-0' : `${startIndex + 1}-${Math.min(endIndex, filteredProjects.length)}`} of {filteredProjects.length} entries
            </p>

            {/* Pagination */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                className="cursor-pointer border-[0.8px] border-[#878585] bg-transparent overflow-hidden flex items-center justify-start px-[10px] py-[5.5px] text-gray-600 rounded-none"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant="outline"
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-none border-[rgb(135,133,133)] ${
                    currentPage === page
                      ? 'bg-[#f4f2fa] text-[#490972] shadow-[inset_-1px_-2px_8px_rgba(41,0,156,0.25)] border-t-[0.8px] border-b-[0.8px] border-t-[rgb(135,133,133)] border-b-[rgb(135,133,133)]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="ghost"
                onClick={handleNext}
                className="cursor-pointer border-[0.8px] border-[#878585] bg-transparent overflow-hidden flex items-center justify-start px-[10px] py-[5.5px] text-gray-600 rounded-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}