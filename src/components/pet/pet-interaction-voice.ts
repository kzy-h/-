const DATABASE_NAME = "lingchat-pet-interaction-audio";
const DATABASE_VERSION = 1;
const STORE_NAME = "voices";

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  const opened = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to open voice cache"));
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });

  databasePromise = opened;
  return opened;
}

export async function readCachedInteractionVoice(key: string): Promise<ArrayBuffer | null> {
  try {
    const database = await openDatabase();
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result instanceof ArrayBuffer ? result : null);
      };
      request.onerror = () => reject(request.error ?? new Error("Unable to read voice cache"));
    });
  } catch (error) {
    console.warn("读取桌宠互动语音缓存失败，将重新合成:", error);
    return null;
  }
}

export async function writeCachedInteractionVoice(key: string, audio: ArrayBuffer): Promise<void> {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(audio, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Unable to write voice cache"));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Voice cache transaction aborted"));
    });
  } catch (error) {
    // 缓存失败不应影响动作、字幕或本次语音播放。
    console.warn("保存桌宠互动语音缓存失败:", error);
  }
}
