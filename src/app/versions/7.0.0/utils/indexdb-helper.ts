/**
 * IndexedDB Helper Utility
 * 
 * Provides functions to interact with IndexedDB for autosaving editor state.
 */

const DB_NAME = 'VideoEditorProDB';
const DB_VERSION = 2; // Increment to add video cache store
const PROJECTS_STORE = 'projects';
const AUTOSAVE_STORE = 'autosave';
const VIDEO_CACHE_STORE = 'videoCache';


/**
 * Initialize the IndexedDB database
 * @returns Promise that resolves when the database is ready
 */
export const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create projects store
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const projectsStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        projectsStore.createIndex('name', 'name', { unique: false });
        projectsStore.createIndex('lastModified', 'lastModified', { unique: false });
      }
      
      // Create autosave store
      if (!db.objectStoreNames.contains(AUTOSAVE_STORE)) {
        const autosaveStore = db.createObjectStore(AUTOSAVE_STORE, { keyPath: 'id' });
        autosaveStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // Create video cache store
      if (!db.objectStoreNames.contains(VIDEO_CACHE_STORE)) {
        const videoCacheStore = db.createObjectStore(VIDEO_CACHE_STORE, { keyPath: 'url' });
        videoCacheStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        videoCacheStore.createIndex('expirationTime', 'expirationTime', { unique: false });
        videoCacheStore.createIndex('downloadTimestamp', 'downloadTimestamp', { unique: false });
      }
    };
  });
};

/**
 * Save editor state to autosave store
 * @param projectId Unique identifier for the project
 * @param editorState Current state of the editor
 * @returns Promise that resolves when the save is complete
 */
export const saveEditorState = async (projectId: string, editorState: any): Promise<void> => {
  try {
    
    const db = await initDatabase();
    const transaction = db.transaction([AUTOSAVE_STORE], 'readwrite');
    const store = transaction.objectStore(AUTOSAVE_STORE);

    const autosaveData = {
      id: projectId,
      editorState,
      timestamp: new Date().getTime()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(autosaveData);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error saving editor state:', event);
        reject('Error saving editor state');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to save editor state:', error);
    throw error;
  }
};

/**
 * Load editor state from autosave store
 * @param projectId Unique identifier for the project
 * @returns Promise that resolves with the editor state or null if not found
 */
export const loadEditorState = async (projectId: string): Promise<any | null> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([AUTOSAVE_STORE], 'readonly');
    const store = transaction.objectStore(AUTOSAVE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.editorState : null);
      };
      
      request.onerror = (event) => {
        console.error('Error loading editor state:', event);
        reject('Error loading editor state');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to load editor state:', error);
    throw error;
  }
};

/**
 * Clear autosave data for a project
 * @param projectId Unique identifier for the project
 * @returns Promise that resolves when the delete is complete
 */
export const clearAutosave = async (projectId: string): Promise<void> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([AUTOSAVE_STORE], 'readwrite');
    const store = transaction.objectStore(AUTOSAVE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(projectId);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error clearing autosave:', event);
        reject('Error clearing autosave');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to clear autosave:', error);
    throw error;
  }
};

/**
 * Check if there's an autosave for a project
 * @param projectId Unique identifier for the project
 * @returns Promise that resolves with the timestamp of the autosave or null if not found
 */
export const hasAutosave = async (projectId: string): Promise<number | null> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([AUTOSAVE_STORE], 'readonly');
    const store = transaction.objectStore(AUTOSAVE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.timestamp : null);
      };
      
      request.onerror = (event) => {
        console.error('Error checking autosave:', event);
        reject('Error checking autosave');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to check autosave:', error);
    throw error;
  }
};

// Video cache item interface
export interface VideoCacheItem {
  url: string;
  blobData: Blob;
  downloadTimestamp: number;
  lastAccessed: number;
  expirationTime: number;
  size: number;
  filename: string;
}

/**
 * Add a video to cache
 */
export const addCachedVideo = async (
  url: string, 
  blob: Blob, 
  filename: string,
  expirationHours: number = 48
): Promise<boolean> => {
  try {
    const db = await initDatabase();
    const now = Date.now();
    
    const cacheItem: VideoCacheItem = {
      url,
      blobData: blob,
      downloadTimestamp: now,
      lastAccessed: now,
      expirationTime: now + (expirationHours * 60 * 60 * 1000),
      size: blob.size,
      filename
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_CACHE_STORE);
      
      const request = store.put(cacheItem);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error caching video:', event);
        resolve(false);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in addCachedVideo:', error);
    return false;
  }
};

/**
 * Get a cached video by URL
 */
export const getCachedVideo = async (url: string): Promise<string | null> => {
  try {
    const db = await initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_CACHE_STORE);
      
      const request = store.get(url);
      
      request.onsuccess = () => {
        const result = request.result as VideoCacheItem | undefined;
        
        if (!result) {
          resolve(null);
          return;
        }
        
        // Check if expired
        if (Date.now() > result.expirationTime) {
          store.delete(url);
          resolve(null);
          return;
        }
        
        // Update last accessed time
        result.lastAccessed = Date.now();
        store.put(result);
        
        // Create blob URL for the cached video
        const blobUrl = URL.createObjectURL(result.blobData);
        resolve(blobUrl);
      };
      
      request.onerror = (event) => {
        console.error('Error getting cached video:', event);
        resolve(null);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in getCachedVideo:', error);
    return null;
  }
};

/**
 * Delete a cached video by URL
 */
export const deleteCachedVideo = async (url: string): Promise<boolean> => {
  try {
    const db = await initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_CACHE_STORE);
      
      const request = store.delete(url);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error deleting cached video:', event);
        resolve(false);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in deleteCachedVideo:', error);
    return false;
  }
};

/**
 * Clean up expired videos
 */
export const cleanupExpiredVideos = async (): Promise<number> => {
  try {
    const db = await initDatabase();
    const now = Date.now();
    let deletedCount = 0;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_CACHE_STORE);
      const index = store.index('expirationTime');
      
      const request = index.openCursor(IDBKeyRange.upperBound(now));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error cleaning up expired videos:', event);
        resolve(0);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in cleanupExpiredVideos:', error);
    return 0;
  }
};

/**
 * Clear all cached videos
 */
export const clearAllCachedVideos = async (): Promise<boolean> => {
  try {
    const db = await initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_CACHE_STORE);
      
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error clearing video cache:', event);
        resolve(false);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in clearAllCachedVideos:', error);
    return false;
  }
};
