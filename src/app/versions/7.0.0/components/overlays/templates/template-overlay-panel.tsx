import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useEditorContext } from "../../../contexts/editor-context";
import { TemplateOverlay, OverlayType } from "../../../types";
import { useTemplates } from "../../../hooks/use-templates";
import { TemplateThumbnail } from "./template-thumbnail";
import { Pencil } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useSidebar } from "../../../contexts/sidebar-context";


//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

export const TemplateOverlayPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateOverlay | null>(null);
  const [dialogPosition, setDialogPosition] = useState<{x: number, y: number} | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { 
    loadTemplateIntoEditor, 
    projectName, 
    setProjectName, 
    isLoadingTemplate = false,
    templateLoadingProgress = { current: 0, total: 0 }
  } = useEditorContext();
  const { setIsOpen, setActivePanel } = useSidebar();
  


  const { templates, isLoading, error } = useTemplates({
    searchQuery,
  });

  // Add state for client templates
  const [clientTemplates, setClientTemplates] = useState<TemplateOverlay[]>([]);
  const [clientTemplatesLoading, setClientTemplatesLoading] = useState(false);
  const [clientTemplatesError, setClientTemplatesError] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmingTemplateId, setConfirmingTemplateId] = useState<string | null>(null);
  const [activeTemplateFilter, setActiveTemplateFilter] = useState<'active' | 'all'>('active');
  const [hidingTemplateId, setHidingTemplateId] = useState<string | null>(null);
  // Update template name function
  
  const updateTemplateName = async (templateId: string, newName: string) => {
    try {
      const uid = getUidFromUrl();
      
      // Get the current project name before updating
      const oldProjectName = projectName;
      
      // First update the project name in the editor immediately
      setProjectName(newName);
      
      // Update local state
      setClientTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, name: newName, updatedAt: new Date().toISOString() }
          : template
      ));
      
      // First, find the actual projectId from projects list
      const projectsResponse = await fetch(`${apiBaseUrl}/save-to-user/get?uid=${uid}`);
      const projectsData = await projectsResponse.json();
      const actualProject = projectsData.projects?.find((p: any) => p.name === oldProjectName);

      if (!actualProject) {
        console.error('Project not found in projects list');
        return;
      }

      const updateResponse = await fetch(`${apiBaseUrl}/save-to-user/update-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          oldName: oldProjectName,
          newName: newName,
          projectId: actualProject.id,
        }),
      });
      
      if (updateResponse.ok) {
        // Trigger events to refresh UI components
        window.dispatchEvent(new CustomEvent('projectSaved', { 
          detail: { projectName: newName } 
        }));
        
        window.dispatchEvent(new CustomEvent('templateUpdated', { 
          detail: { isUpdate: true, templateName: newName }
        }));
        
        window.dispatchEvent(new CustomEvent('projectNameChanged', { 
          detail: { 
            projectId: `${uid}-${oldProjectName}`,
            oldName: oldProjectName,
            newName: newName 
          } 
        }));
        
        setEditingTemplateId(null);
        setEditingName("");
      } else {
        console.error('Failed to update project name');
        // Revert the project name if API call failed
        setProjectName(oldProjectName);
        setClientTemplates(prev => prev.map(template => 
          template.id === templateId 
            ? { ...template, name: oldProjectName }
            : template
        ));
      }
    } catch (error) {
      console.error('Error updating template name:', error);
    }
  };

  // Get UID from URL
  const getUidFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid') || 'default';
  };

  // Function to fetch client templates
  const fetchClientTemplates = async () => {
    setClientTemplatesLoading(true);
    setClientTemplatesError(null);
    try {
      const uid = getUidFromUrl();
      const response = await fetch(`${apiBaseUrl}/templates/client?uid=${uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      // Add default status 'active' to templates that don't have status
      const templatesWithStatus = data.map((template: any) => ({
        ...template,
        status: template.status || 'active'
      }));
      setClientTemplates(templatesWithStatus);
    } catch (error) {
      setClientTemplatesError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setClientTemplatesLoading(false);
    }
  };

  const handleEditStart = (template: TemplateOverlay) => {
    setEditingTemplateId(template.id);
    setEditingName(template.name);
  };

  const handleEditSave = () => {
    if (editingTemplateId && editingName.trim()) {
      updateTemplateName(editingTemplateId, editingName.trim());
    }
  };

  const handleEditCancel = () => {
    setEditingTemplateId(null);
    setEditingName("");
  };

  useEffect(() => {
    const handleTemplateUpdate = (event: Event) => {
      // Always refresh client templates when a template is saved
      fetchClientTemplates();
    };

    window.addEventListener('templateUpdated', handleTemplateUpdate);
    return () => window.removeEventListener('templateUpdated', handleTemplateUpdate);
  }, []);

  // Listen for project status changes to sync template status
  useEffect(() => {
    const handleTemplateStatusChanged = (event: CustomEvent) => {
      const { templateName, status } = event.detail;
      
      // Update the template status in local state
      setClientTemplates(prev => 
        prev.map(template => 
          template.name === templateName 
            ? { ...template, status: status }
            : template
        )
      );
    };

    window.addEventListener('templateStatusChanged', handleTemplateStatusChanged as EventListener);
    return () => window.removeEventListener('templateStatusChanged', handleTemplateStatusChanged as EventListener);
  }, []);
  

  // Reset filter when switching to created-by-you tab
  useEffect(() => {
    if (activeTab === "created-by-you") {
      setActiveTemplateFilter('active');
      fetchClientTemplates();
    }
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the useTemplates hook
  };

  const handleApplyTemplate = async (template: TemplateOverlay) => {
    try {
      await loadTemplateIntoEditor(template);
      setConfirmDialogOpen(false);
      setConfirmingTemplateId(null);
      setActivePanel(OverlayType.NONE);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to apply template:', error);
      // Keep confirmation dialog open on error
    }
  };

  const handleSelectTemplate = (template: TemplateOverlay, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmingTemplateId(template.id);
    setSelectedTemplate(template);
  };

  const handleImportTemplate = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const template = JSON.parse(content) as TemplateOverlay;
      setSelectedTemplate(template);
      setConfirmDialogOpen(true);
    } catch (err) {
      console.error("Failed to import template:", err);
      // You might want to add proper error handling/notification here
    }
  };

  // Handle toggling template active status
  const handleToggleTemplateStatus = async (templateId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const uid = getUidFromUrl();
    
    // Find the template to get its name
    const template = clientTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    // Show loading indicator when hiding (going from active to inactive)
    if (currentStatus === 'active') {
      setHidingTemplateId(templateId);
    }
    
    try {
      // Update the corresponding project status via API first
      const response = await fetch(`${apiBaseUrl}/save-to-user/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          projectId: `${uid}-${template.name}`,
          status: newStatus,
        }),
      });
      
      if (response.ok) {
        // Only update the template status in local state after successful API call
        setClientTemplates(prev => 
          prev.map(t => 
            t.id === templateId 
              ? { ...t, status: newStatus }
              : t
          )
        );
        
        // Trigger event to refresh saved projects
        window.dispatchEvent(new CustomEvent('projectStatusChanged', { 
          detail: { 
            projectName: template.name,
            status: newStatus
          } 
        }));
        
        // Hide loading indicator after a short delay to show the action completed
        setTimeout(() => {
          setHidingTemplateId(null);
        }, 500);
      } else {
        // Hide loading indicator on error
        setHidingTemplateId(null);
        console.error('Failed to update project status');
      }
    } catch (error) {
      // Hide loading indicator on error
      setHidingTemplateId(null);
      console.error('Error updating corresponding project status:', error);
    }
  };

  return (
    <section className="flex flex-col bg-[rgb(244,242,250)] h-full overflow-hidden" style={{margin}}>
      {/* Header */}
      {/* <div className="w-full flex flex-col items-center" style={{ gap: '8px', marginTop: '8px'}}>
        <div className="bg-[rgb(65,77,92)] rounded-[1px]" style={{ width: '42px', height: '2px', minHeight: '2px' }} />
        <p className="flex items-center font-bold text-[rgb(47,46,46)]" style={{ fontSize: '14px', lineHeight: '1.14', fontFamily: "'Poppins',Helvetica,Arial,serif" }}>
          Templates
        </p>
      </div> */}

      <div className="w-full flex flex-col items-center gap-y-2 flex-shrink-0">
            <div className="flex flex-col gap-y-2 items-center">
              <hr className="bg-[rgb(65,77,92)] rounded w-[2.625rem] h-[2px] border-0" />
              <h1 className="flex items-center font-bold text-3.5 leading-1.14 font-['Poppins',Helvetica,Arial,serif] text-[rgb(47,46,46)] w-full">
                Templates
              </h1>
            </div>
          </div>

      {/* Tab Navigation */}
      <div className="flex items-center" style={{marginTop: '8px', marginRight: '10px', marginBottom: '8px', marginLeft: '12px'}}>
        <button
          onClick={() => setActiveTab('templates')}
          className="flex justify-center items-center font-bold text-center transition-colors"
          style={{ 
            fontSize: '12px', 
            lineHeight: '1', 
            fontFamily: "'Poppins',Helvetica,Arial,serif",
            letterSpacing: '-0.06px',
            paddingTop: '8px',
            paddingBottom: '8px',
            flex: '1',
            borderBottom: activeTab === 'templates' ? '1px solid rgb(73,9,114)' : '1px solid transparent',
            color: activeTab === 'templates' ? 'rgb(73,9,114)' : 'rgb(135,133,133)',
            boxShadow: activeTab === 'templates' ? 'inset 10px 10px 50px 0px rgba(57, 25, 148, 0.15)' : 'none'
          }}
        >
          System Templates
        </button>
        <button
          onClick={() => {
            setActiveTab('created-by-you');
            fetchClientTemplates();
          }}
          className="flex justify-center items-center font-bold text-center transition-colors"
          style={{ 
            fontSize: '12px', 
            lineHeight: '1', 
            fontFamily: "'Poppins',Helvetica,Arial,serif",
            letterSpacing: '-0.06px',
            paddingTop: '8px',
            paddingBottom: '8px',
            flex: '1',
            borderBottom: activeTab === 'created-by-you' ? '1px solid rgb(73,9,114)' : '1px solid transparent',
            color: activeTab === 'created-by-you' ? 'rgb(73,9,114)' : 'rgb(135,133,133)',
            boxShadow: activeTab === 'created-by-you' ? 'inset 10px 10px 50px 0px rgba(57, 25, 148, 0.15)' : 'none'
          }}
        >
          Created by you
        </button>
      </div>

      {/* Filter buttons - only show for Created By You tab */}
      {activeTab === "created-by-you" && (
        <div className="flex border rounded-lg overflow-hidden self-start" style={{ marginTop: '8px', marginLeft: '12px'}}>
          <Button
            variant="ghost"
            onClick={() => setActiveTemplateFilter('active')}
            className={`px-4 py-[10px] rounded-l-lg rounded-r-none font-medium ${
              activeTemplateFilter === 'active'
                ? 'bg-[rgb(41,0,156)]/15 text-[rgb(41,0,156)] border border-[rgb(41,0,156)] hover:bg-[rgb(41,0,156)]/15'
                : 'bg-white text-[rgb(65,77,92)] border border-[rgb(135,133,133)] hover:bg-gray-50'
            }`}
          >
            Active View
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTemplateFilter('all')}
            className={`px-4 py-[10px] rounded-l-none rounded-r-lg font-medium ${
              activeTemplateFilter === 'all'
                ? 'bg-[rgb(41,0,156)]/15 text-[rgb(41,0,156)] border border-[rgb(41,0,156)] hover:bg-[rgb(41,0,156)]/15'
                : 'bg-white text-[rgb(65,77,92)] border border-[rgb(135,133,133)] hover:bg-gray-50'
            }`}
          >
            All
          </Button>
        </div>
      )}

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex" style={{ gap: '8px', marginTop: '8px', marginRight: '10px', marginBottom: '8px', marginLeft: '12px' }}>
        <Input
          placeholder="Search Template"
          value={searchQuery}
          className="flex items-center bg-white rounded border border-[rgb(135,133,133)] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[rgb(135,133,133)]"
          style={{ 
            fontSize: '12px',
            lineHeight: '1',
            fontFamily: "'Poppins',Helvetica,Arial,serif",
            color: 'rgb(135,133,133)',
            paddingLeft: '10px',
            paddingTop: '6px',
            paddingBottom: '6px',
            marginRight: '2px'
          }}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      {error && (
        <div className="text-red-500 text-xs" style={{ padding: '8px' }}>
          Error loading templates: {error}
        </div>
      )}

      {/* Template Content with Independent Scroll */}
      <div className="flex gap-x-px" style={{ flex: '1', minHeight: '0', marginTop: '8px', marginRight: '10px', marginBottom: '8px', marginLeft: '12px' }}>
        <div className="flex-1 overflow-y-auto" style={{ paddingRight: '4px' }}>
          {activeTab === 'templates' ? (
            // System Templates Tab
            <div className="flex flex-col" style={{ gap: '8px' }}>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="bg-white rounded animate-pulse"
                    style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <div className="flex" style={{ gap: '6px' }}>
                      <div className="rounded bg-gray-200" style={{ width: '65px', height: '60px' }} />
                      <div className="flex flex-col" style={{ width: '136px', gap: '4px' }}>
                        <div className="h-3 bg-gray-200 rounded" style={{ width: '80px' }} />
                        <div className="h-4 bg-gray-200 rounded" style={{ width: '128px' }} />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                      </div>
                    </div>
                  </div>
                ))
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    {confirmingTemplateId === template.id ? (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded" style={{ padding: '16px' }}>
                        <h3 className="font-semibold mb-2" style={{ fontSize: '14px' }}>Apply Template</h3>
                        {isLoadingTemplate ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p className="text-gray-600" style={{ fontSize: '12px' }}>
                              Loading template and downloading videos...
                            </p>
                            {templateLoadingProgress.total > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="flex justify-between" style={{ fontSize: '12px' }}>
                                  <span>Videos: {templateLoadingProgress.current}/{templateLoadingProgress.total}</span>
                                  <span>{Math.round((templateLoadingProgress.current / templateLoadingProgress.total) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full" style={{ height: '8px' }}>
                                  <div 
                                    className="bg-blue-600 rounded-full transition-all duration-300" 
                                    style={{ 
                                      height: '8px',
                                      width: `${(templateLoadingProgress.current / templateLoadingProgress.total) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full border-2 border-blue-500 border-t-transparent" style={{ height: '24px', width: '24px' }}></div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-600 mb-4" style={{ fontSize: '12px' }}>
                              Are you sure you want to add this template to your timeline? It will replace all existing overlays.
                            </p>
                            <div className="flex justify-end" style={{ gap: '8px' }}>
                              <button 
                                className="border rounded hover:bg-gray-50"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => setConfirmingTemplateId(null)}
                              >
                                Cancel
                              </button>
                              <button 
                                className="bg-[#490972] text-white rounded hover:bg-[#490972]/90"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleApplyTemplate(template)}
                              >
                                Apply Template
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div onClick={(e) => handleSelectTemplate(template, e)}>
                        <div className="flex" style={{ gap: '6px' }}>
                          <div className="rounded overflow-hidden flex-shrink-0" style={{ width: '65px', height: '60px' }}>
                            <TemplateThumbnail
                              thumbnail={template.thumbnail}
                              name={template.name}
                            />
                          </div>

                          <div className="w-full flex flex-col" style={{ gap: '4px' }}>
                            <p className="font-light text-[rgb(65,77,92)]" style={{ fontSize: '10px', lineHeight: '1.2', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                              {new Date(template.updatedAt).toLocaleDateString()}
                            </p>

                            <div className="flex flex-col" style={{ gap: '4px' }}>
                              <div className="flex items-start" style={{ gap: '4px' }}>
                                <p className="font-semibold text-[rgb(47,46,46)] flex-1" style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                                  {template.name}
                                </p>
                                <img
                                  style={{ width: '12px', marginTop: '2px' }}
                                  src={'/assets/Templates/b10b0e74eb96e748c742287fdf3da959.png'}
                                  alt="icon"
                                />
                              </div>

                              <p className="text-[rgb(65,77,92)] line-clamp-2" style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex ml-auto" style={{ gap: '4px', marginTop: '8px' }}>
                          {template.tags.slice(0, 2).map((tag, index) => (
                            <p
                              key={index}
                              className="flex justify-center text-center bg-[rgb(224,224,224)] rounded-sm text-[rgb(65,77,92)]"
                              style={{ fontSize: '10px', lineHeight: '1.5', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px', padding: '0 4px' }}
                            >
                              {tag}
                            </p>
                          ))}
                          {template.tags.length > 2 && (
                            <span className="text-[rgb(135,133,133)]" style={{ fontSize: '10px' }}>
                              +{template.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '32px 0', fontSize: '14px' }}>
                  No templates found
                </div>
              )}
            </div>
          ) : (
            // Created By You Tab
            <div className="flex flex-col" style={{ gap: '8px' }}>
              {clientTemplatesLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="bg-white rounded animate-pulse"
                    style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <div className="flex" style={{ gap: '6px' }}>
                      <div className="rounded bg-gray-200" style={{ width: '65px', height: '60px' }} />
                      <div className="flex flex-col" style={{ width: '136px', gap: '4px' }}>
                        <div className="h-3 bg-gray-200 rounded" style={{ width: '80px' }} />
                        <div className="h-4 bg-gray-200 rounded" style={{ width: '128px' }} />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                      </div>
                    </div>
                  </div>
                ))
              ) : clientTemplatesError ? (
                <div className="flex flex-col items-center justify-center text-red-500" style={{ padding: '32px 0', fontSize: '14px' }}>
                  Error loading templates: {clientTemplatesError}
                </div>
              ) : clientTemplates.filter(template => 
                  activeTemplateFilter === 'all' || (template as any).status === 'active'
                ).length > 0 ? (
                clientTemplates.filter(template => 
                  activeTemplateFilter === 'all' || (template as any).status === 'active'
                ).map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors group relative"
                    style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    {confirmingTemplateId === template.id ? (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded" style={{ padding: '16px' }}>
                        <h3 className="font-semibold mb-2" style={{ fontSize: '14px' }}>Apply Template</h3>
                        <p className="text-gray-600 mb-4" style={{ fontSize: '12px' }}>
                          Are you sure you want to add this template to your timeline? It will replace all existing overlays.
                        </p>
                        <div className="flex justify-end" style={{ gap: '8px' }}>
                          <button 
                            className="border rounded hover:bg-gray-50"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => setConfirmingTemplateId(null)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="bg-blue-500 text-white rounded hover:bg-blue-600"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => {
                              handleApplyTemplate(template);
                              setConfirmingTemplateId(null);
                            }}
                          >
                            Apply Template
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={(e) => handleSelectTemplate(template, e)}>
                        {/* Hide/Show button - appears on hover */}
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ top: '8px', right: '8px', zIndex: 10 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTemplateStatus(template.id, (template as any).status || 'active');
                            }}
                            className={`text-white rounded-sm flex items-center ${
                              (template as any).status === 'inactive' 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-gray-500 hover:bg-gray-600'
                            }`}
                            style={{ padding: '4px 8px', fontSize: '12px', gap: '4px' }}
                            title={(template as any).status === 'inactive' ? 'Show in Active View' : 'Hide from Active View'}
                          >
                            {hidingTemplateId === template.id ? (
                              <>
                                <div className="animate-spin rounded-full border border-white border-t-transparent" style={{ height: '12px', width: '12px' }} />
                                <span>Hiding</span>
                              </>
                            ) : (
                              <span>{(template as any).status === 'inactive' ? 'Show' : 'Hide'}</span>
                            )}
                          </button>
                        </div>

                        <div className="flex" style={{ gap: '6px' }}>
                          <div className="rounded overflow-hidden flex-shrink-0" style={{ width: '65px', height: '60px' }}>
                            <TemplateThumbnail
                              thumbnail={template.thumbnail}
                              name={template.name}
                            />
                          </div>

                          <div className="w-full flex flex-col" style={{ gap: '4px' }}>
                            <p className="font-light text-[rgb(65,77,92)]" style={{ fontSize: '10px', lineHeight: '1.2', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                              {new Date(template.updatedAt).toLocaleDateString()}
                            </p>

                            <div className="flex flex-col" style={{ gap: '4px' }}>
                              <div className="flex items-center" style={{ gap: '4px' }}>
                                {editingTemplateId === template.id ? (
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditSave();
                                      } else if (e.key === 'Escape') {
                                        handleEditCancel();
                                      }
                                    }}
                                    className="font-semibold text-[rgb(47,46,46)] flex-1 bg-transparent border-b border-gray-300 focus:outline-none focus:border-purple-500"
                                    style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <>
                                    <p className="font-semibold text-[rgb(47,46,46)] flex-1" style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                                      {template.name}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditStart(template);
                                      }}
                                      className="bg-gray-200 hover:bg-gray-300 rounded transition-all"
                                      style={{ padding: '4px' }}
                                      title="Edit template name"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                  </>
                                )}
                                <img
                                  style={{ width: '12px', marginTop: '2px' }}
                                  src={'/assets/Templates/b10b0e74eb96e748c742287fdf3da959.png'}
                                  alt="icon"
                                />
                              </div>

                              <p className="text-[rgb(65,77,92)] line-clamp-2" style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                                {template.description || 'Template created from editor'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex ml-auto" style={{ gap: '4px', marginTop: '8px' }}>
                          {template.tags.slice(0, 2).map((tag, index) => (
                            <p
                              key={index}
                              className="flex justify-center text-center bg-[rgb(224,224,224)] rounded-sm text-[rgb(65,77,92)]"
                              style={{ fontSize: '10px', lineHeight: '1.5', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px', padding: '0 4px' }}
                            >
                              {tag}
                            </p>
                          ))}
                          {template.tags.length > 2 && (
                            <span className="text-[rgb(135,133,133)]" style={{ fontSize: '10px' }}>
                              +{template.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '32px 0', fontSize: '14px' }}>
                  No templates created yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};