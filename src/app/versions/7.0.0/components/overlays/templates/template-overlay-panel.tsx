import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useEditorContext } from "../../../contexts/editor-context";
import { TemplateOverlay } from "../../../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useTemplates } from "../../../hooks/use-templates";
import { TemplateThumbnail } from "./template-thumbnail";
import { Play, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const TemplateOverlayPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateOverlay | null>(null);
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

  // Delete template function
  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/latest/templates/delete?id=${templateId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setClientTemplates(prev => prev.filter(template => template.id !== templateId));
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

  // Listen for template updates from editor
  useEffect(() => {
    const handleTemplateUpdate = (event: Event) => {
      // Refresh client templates if we're on that tab
      if (activeTab === "created-by-you") {
        setClientTemplatesLoading(true);
        fetch('/api/latest/templates/client')
          .then(response => response.json())
          .then(data => {
            setClientTemplates(data);
            setClientTemplatesLoading(false);
          })
          .catch(error => {
            setClientTemplatesError(error.message);
            setClientTemplatesLoading(false);
          });
      }
    };

    window.addEventListener('templateUpdated', handleTemplateUpdate);
    return () => window.removeEventListener('templateUpdated', handleTemplateUpdate);
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the useTemplates hook
  };

  const handleApplyTemplate = (template: TemplateOverlay) => {
    loadTemplateIntoEditor(template);
    setConfirmDialogOpen(false);
  };

  const handleSelectTemplate = (template: TemplateOverlay) => {
    setSelectedTemplate(template);
    setConfirmDialogOpen(true);
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1 mb-2 flex-shrink-0">
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">Templates</span>
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
              placeholder="Search templates..."
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
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="p-2 sm:p-3 space-y-2">
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
                    className="cursor-pointer hover:bg-accent transition-colors duration-200 relative group/item"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="p-2 sm:p-3 space-y-2">
                      <div className="aspect-video w-full overflow-hidden rounded-md">
                        <TemplateThumbnail
                          thumbnail={template.thumbnail}
                          name={template.name}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-1">
                          {editingTemplateId === template.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={handleEditSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              className="flex-1 text-xs sm:text-sm font-light bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5"
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
                                className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="Edit template name"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
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

                    {/* Delete button - only in Created By You tab */}
                    <button
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 
                        text-white p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-all duration-200 
                        shadow-sm hover:shadow-md transform hover:scale-105"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await deleteTemplate(template.id);
                      }}
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

      <AlertDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
      >
        <AlertDialogContent className="w-[90%] max-w-md mx-auto rounded-md p-3 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm sm:text-base">
              Apply Template
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to add this template to your timeline? It
              will replace all existing overlays.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3">
            <AlertDialogCancel className="h-8 sm:h-10 text-xs sm:text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-8 sm:h-10 text-xs sm:text-sm"
              onClick={() =>
                selectedTemplate && handleApplyTemplate(selectedTemplate)
              }
            >
              Apply Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
};