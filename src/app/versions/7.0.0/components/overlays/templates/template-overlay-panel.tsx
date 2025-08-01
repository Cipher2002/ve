import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useEditorContext } from "../../../contexts/editor-context";
import { TemplateOverlay } from "../../../types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useTemplates } from "../../../hooks/use-templates";
import { TemplateThumbnail } from "./template-thumbnail";
import { Pencil } from "lucide-react";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";

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

//   const deleteTemplate = async (templateId: string) => {
//   try {
//     console.log('Attempting to delete template:', templateId);
//     console.log('API URL:', `/api/latest/templates/delete?id=${templateId}`);
    
//     const uid = getUidFromUrl();
//     const response = await fetch(`/api/latest/templates/delete?id=${templateId}&uid=${uid}`, {
//       method: 'DELETE',
//     });
    
//     console.log('Response status:', response.status);
//     console.log('Response:', response);
    
//     if (response.ok) {
//       const result = await response.json();
//       console.log('Delete result:', result);
//       // Clear the deleting state immediately
//       setDeletingTemplateId(null);
//       // Refresh the list after deletion
//       await fetchClientTemplates();
//     } else {
//       console.error('Failed to delete template, status:', response.status);
//       const errorText = await response.text();
//       console.error('Error response:', errorText);
//       setDeletingTemplateId(null);
//     }
//   } catch (error) {
//     console.error('Error deleting template:', error);
//     setDeletingTemplateId(null);
//   }
// };

  // Update template name function
  // const updateTemplateName = async (templateId: string, newName: string) => {
  //   try {
  //     const uid = getUidFromUrl();
  //     const response = await fetch(`/api/latest/templates/update-name?uid=${uid}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ templateId, newName })
  //     });
      
  //     if (response.ok) {
  //       const result = await response.json();
        
  //       // Update local state
  //       setClientTemplates(prev => prev.map(template => 
  //         template.id === templateId 
  //           ? { ...template, name: newName, updatedAt: result.template.updatedAt }
  //           : template
  //       ));
        
  //       // Always update the project name in the editor when renaming a template
  //       setProjectName(newName);
        
  //       // Trigger a refresh of the saved projects
  //       window.dispatchEvent(new CustomEvent('projectSaved', { 
  //         detail: { projectName: newName } 
  //       }));
        
  //       setEditingTemplateId(null);
  //       setEditingName("");
  //     } else {
  //       console.error('Failed to update template name');
  //     }
  //   } catch (error) {
  //     console.error('Error updating template name:', error);
  //   }
  // };

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
      
      // Call the project name update API to handle folder renaming
      const updateResponse = await fetch('/api/latest/save-to-user/update-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          oldName: oldProjectName,
          newName: newName,
          projectId: `${uid}-${oldProjectName}`,
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
      const response = await fetch(`/api/latest/templates/client?uid=${uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setClientTemplates(data);
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
  
  // Fetch client templates when "Created By You" tab is active
  useEffect(() => {
    if (activeTab === "created-by-you") {
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
    const uid = getUidFromUrl();
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/latest/templates/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          templateId,
          status: newStatus,
        }),
      });
      
      if (response.ok) {
        // Update the template status in the local state
        setClientTemplates(prev => 
          prev.map(template => 
            template.id === templateId 
              ? { ...template, status: newStatus }
              : template
          )
        );
      } else {
        console.error('Failed to update template status');
      }
    } catch (error) {
      console.error('Error updating template status:', error);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 sm:gap-4 sm:p-4 bg-gray-100/40 dark:bg-gray-900/40 h-full">
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        if (value === "created-by-you") {
          fetchClientTemplates();
        }
      }} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1 mb-2 flex-shrink-0">
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">System Templates</span>
          </TabsTrigger>
          <TabsTrigger
            value="created-by-you"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">Created By You</span>
          </TabsTrigger>
        </TabsList>

        {/* Filter buttons for Created By You tab */}
        {activeTab === "created-by-you" && (
          <div className="flex border rounded-lg overflow-hidden mb-2 self-start">
            <button
              onClick={() => setActiveTemplateFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-l-lg rounded-r-none ${
                activeTemplateFilter === 'active'
                  ? 'bg-blue-500/15 text-blue-700 border border-blue-300 hover:bg-blue-500/15'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Active View
            </button>
            <button
              onClick={() => setActiveTemplateFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-l-none rounded-r-lg ${
                activeTemplateFilter === 'all'
                  ? 'bg-blue-500/15 text-blue-700 border border-blue-300 hover:bg-blue-500/15'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
          </div>
        )}
        
        <div className="flex gap-2 flex-shrink-0">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="Search system templates..."
              value={searchQuery}
              className="flex-1 h-8 sm:h-10 text-xs sm:text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:ring-blue-400 md:text-base"
              onChange={(e) => setSearchQuery(e.target.value)}
              // NOTE: Stops zooming in on input focus on iPhone
              style={{ fontSize: "16px" }}
            />
          </form>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportTemplate}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import template"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-xs sm:text-sm p-2 flex-shrink-0">
            Error loading templates: {error}
          </div>
        )}

        <TabsContent value="templates" className="flex-1 min-h-0">
          <div className="h-full overflow-auto">
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 p-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="relative aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse rounded-sm"
                  />
                ))
              ) : templates.length > 0 ? (
                templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:bg-accent transition-colors duration-200"
                >
                {/* {confirmingTemplateId === template.id ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-md">
                    <h3 className="text-sm font-semibold mb-2">Apply Template</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                      Are you sure you want to add this template to your timeline? It will replace all existing overlays.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button 
                        className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setConfirmingTemplateId(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => {
                          handleApplyTemplate(template);
                          setConfirmingTemplateId(null);
                        }}
                      >
                        Apply Template
                      </button>
                    </div>
                  </div>
                ) : ( */}
                {confirmingTemplateId === template.id ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-md">
                    <h3 className="text-sm font-semibold mb-2">Apply Template</h3>
                    {isLoadingTemplate ? (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Loading template and downloading videos...
                        </p>
                        {templateLoadingProgress.total > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Videos: {templateLoadingProgress.current}/{templateLoadingProgress.total}</span>
                              <span>{Math.round((templateLoadingProgress.current / templateLoadingProgress.total) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${(templateLoadingProgress.current / templateLoadingProgress.total) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                          Are you sure you want to add this template to your timeline? It will replace all existing overlays.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <button 
                            className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => setConfirmingTemplateId(null)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
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
                    <CardHeader className="p-2 sm:p-3 space-y-2">
                      {/* Keep all the existing CardHeader content here */}
                      <div className="aspect-video w-full overflow-hidden rounded-md">
                        <TemplateThumbnail
                          thumbnail={template.thumbnail}
                          name={template.name}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <CardTitle className="text-xs sm:text-sm font-light">
                          {template.name}
                        </CardTitle>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <div className="pt-1 sm:pt-2 border-t border-border">
                        <div className="flex flex-wrap float-left gap-1 sm:gap-2">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 bg-sky-200 dark:bg-sky-400/30 rounded-sm text-[8px] sm:text-[9px] text-gray-800/70 dark:text-white"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                              +{template.tags.length - 3}
                            </span>
                          )}
                        </div>
                        <div className="flex float-right gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                          <span>
                            {new Date(template.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </div>
                )}
                </Card>
                ))
              ) : (
                <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-4 sm:py-8 text-gray-500 text-xs sm:text-sm">
                  No templates found
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      
        <TabsContent value="created-by-you" className="flex-1 min-h-0">
          <div className="h-full overflow-auto">
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 p-1">
              {clientTemplatesLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="relative aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse rounded-sm"
                  />
                ))
              ) : clientTemplatesError ? (
                <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-4 sm:py-8 text-red-500 text-xs sm:text-sm">
                  Error loading templates: {clientTemplatesError}
                </div>
              ) : clientTemplates.filter(template => 
                  activeTemplateFilter === 'all' || (template as any).status === 'active'
                ).length > 0 ? (
                clientTemplates.filter(template => 
                  activeTemplateFilter === 'all' || (template as any).status === 'active'
                ).map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:bg-accent transition-colors duration-200 group"
                >
                {confirmingTemplateId === template.id ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-md">
                    <h3 className="text-sm font-semibold mb-2">Apply Template</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                      Are you sure you want to add this template to your timeline? It will replace all existing overlays.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button 
                        className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setConfirmingTemplateId(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
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
                    <CardHeader className="p-2 sm:p-3 space-y-2 relative">
                      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTemplateStatus(template.id, (template as any).status || 'active');
                          }}
                          className={`p-1 text-white rounded-sm text-xs px-2 py-1 ${
                            (template as any).status === 'inactive' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-gray-500 hover:bg-gray-600'
                          }`}
                          title={(template as any).status === 'inactive' ? 'Show in Active View' : 'Hide from Active View'}
                        >
                          {(template as any).status === 'inactive' ? 'Show' : 'Hide'}
                        </button>
                      </div>
                      {/* Keep all the existing CardHeader content here */}
                      <div className="aspect-video w-full overflow-hidden rounded-md">
                        <TemplateThumbnail
                          thumbnail={template.thumbnail}
                          name={template.name}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        {/* <CardTitle className="text-xs sm:text-sm font-light">
                          {template.name}
                        </CardTitle> */}
                        <div className="flex items-center gap-2">
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
                            className="text-xs sm:text-sm font-light bg-transparent border-b border-gray-300 focus:outline-none focus:border-purple-500 flex-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <CardTitle className="text-xs sm:text-sm font-light flex-1">
                              {template.name}
                            </CardTitle>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(template);
                              }}
                              className="p-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-all"
                              title="Edit template name"
                            >
                              <Pencil size={13} />
                            </button>
                          </>
                        )}
                      </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <div className="pt-1 sm:pt-2 border-t border-border">
                        <div className="flex flex-wrap float-left gap-1 sm:gap-2">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 bg-sky-200 dark:bg-sky-400/30 rounded-sm text-[8px] sm:text-[9px] text-gray-800/70 dark:text-white"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                              +{template.tags.length - 3}
                            </span>
                          )}
                        </div>
                        <div className="flex float-right gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                          <span>
                            {new Date(template.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </div>
                )}
                </Card>
                ))
              ) : (
                <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-4 sm:py-8 text-gray-500 text-xs sm:text-sm">
                  No templates created yet
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
};