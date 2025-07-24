import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useEditorContext } from "../../../contexts/editor-context";
import { TemplateOverlay } from "../../../types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useTemplates } from "../../../hooks/use-templates";
import { TemplateThumbnail } from "./template-thumbnail";
import { Trash2 } from "lucide-react";
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
  const { loadTemplateIntoEditor, projectName, setProjectName } = useEditorContext();


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

  // Delete template function
  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/latest/templates/delete?id=${templateId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh the list after deletion
        await fetchClientTemplates();
      } else {
        console.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Update template name function
  const updateTemplateName = async (templateId: string, newName: string) => {
    try {
      const response = await fetch('/api/latest/templates/update-name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId, newName })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setClientTemplates(prev => prev.map(template => 
          template.id === templateId 
            ? { ...template, name: newName, updatedAt: result.template.updatedAt }
            : template
        ));
        
        // If this is the currently loaded project, update the project name in the editor
        const updatedTemplate = clientTemplates.find(t => t.id === templateId);
        if (updatedTemplate && projectName === updatedTemplate.name) {
          setProjectName(newName);
        }
        
        setEditingTemplateId(null);
        setEditingName("");
      } else {
        console.error('Failed to update template name');
      }
    } catch (error) {
      console.error('Error updating template name:', error);
    }
  };

  // Function to fetch client templates
  const fetchClientTemplates = async () => {
    setClientTemplatesLoading(true);
    setClientTemplatesError(null);
    try {
      const response = await fetch('/api/latest/templates/client');
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

  const handleApplyTemplate = (template: TemplateOverlay) => {
    loadTemplateIntoEditor(template);
    setConfirmDialogOpen(false);
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
              ) : clientTemplates.length > 0 ? (
                clientTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:bg-accent transition-colors duration-200"
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