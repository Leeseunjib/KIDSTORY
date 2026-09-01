// 이 기기에 이야기·그림·소리를 쌓는 KidStory 로컬 금고
(function () {
  const DB_NAME = 'kidstory-vault';
  const DB_VER = 1;
  const PRESET_IDS = { teeth: true, veggie: true, sleep: true };

  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('stories')) {
          db.createObjectStore('stories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function dataUrlToBlob(url) {
    const parts = String(url).split(',');
    if (parts.length < 2) return null;
    const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'application/octet-stream';
    const bin = atob(parts[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async function hashText(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text || ''));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }

  async function requestPersist() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }
    } catch (e) {
      // 브라우저가 지속 저장을 거부해도 금고는 그대로 쓴다.
    }
  }

  function slimPages(pages) {
    return (pages || []).map((p) => ({
      pageNumber: p.pageNumber,
      title: p.title,
      narration: p.narration,
      bgGradient: p.bgGradient,
      isGamePage: !!p.isGamePage,
      illustration: p.illustration || null,
      imageKey: p.imageKey || null,
      audioHash: p.audioHash || null
    }));
  }

  window.KidVault = {
    isPreset(id) {
      return !!PRESET_IDS[id];
    },

    async saveStory(theme, profile) {
      if (!theme || !theme.id || this.isPreset(theme.id)) return theme;
      await requestPersist();
      const db = await openDb();
      const pages = (theme.pages || []).map((p) => ({ ...p }));
      const tx = db.transaction(['stories', 'files'], 'readwrite');
      const files = tx.objectStore('files');

      for (let i = 0; i < pages.length; i += 1) {
        const page = pages[i];
        const imgKey = `img:${theme.id}:${page.pageNumber || i + 1}`;
        if (page.imageUrl && String(page.imageUrl).indexOf('data:') === 0) {
          const blob = dataUrlToBlob(page.imageUrl);
          if (blob) files.put(blob, imgKey);
          page.imageKey = imgKey;
        }
        delete page.imageUrl;
      }

      const record = {
        id: theme.id,
        createdAt: theme.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        childName: (profile && profile.name) || '',
        source: theme.source || 'local',
        model: theme.model || '',
        title: theme.titleTemplate || theme.title || '내 동화',
        badge: theme.badge || '📱 이 기기 동화',
        coverTag: theme.coverTag || '',
        themeColor: theme.themeColor || '#E17055',
        totalPages: pages.length,
        story: {
          id: theme.id,
          titleTemplate: theme.titleTemplate,
          subTitle: theme.subTitle || '',
          themeColor: theme.themeColor || '#E17055',
          badge: theme.badge,
          coverTag: theme.coverTag || '',
          totalPages: pages.length,
          source: theme.source || 'local',
          model: theme.model || '',
          pages: slimPages(pages)
        }
      };
      tx.objectStore('stories').put(record);
      await txDone(tx);
      this.backupToServer(record).catch(() => {});
      return record;
    },

    async listStories() {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const req = db.transaction('stories').objectStore('stories').getAll();
        req.onsuccess = () => {
          const rows = req.result || [];
          rows.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
          resolve(rows);
        };
        req.onerror = () => reject(req.error);
      });
    },

    async loadStory(id) {
      const db = await openDb();
      const record = await new Promise((resolve, reject) => {
        const req = db.transaction('stories').objectStore('stories').get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      if (!record || !record.story) return null;

      const theme = JSON.parse(JSON.stringify(record.story));
      theme.fromVault = true;
      theme.createdAt = record.createdAt;
      for (const page of theme.pages || []) {
        if (!page.imageKey) continue;
        const blob = await new Promise((resolve) => {
          const req = db.transaction('files').objectStore('files').get(page.imageKey);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
        if (blob) page.imageUrl = URL.createObjectURL(blob);
      }
      return theme;
    },

    async touch(id) {
      const db = await openDb();
      const tx = db.transaction('stories', 'readwrite');
      const store = tx.objectStore('stories');
      const record = await new Promise((resolve) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (record) {
        record.updatedAt = new Date().toISOString();
        store.put(record);
      }
      await txDone(tx);
    },

    async saveAudio(storyId, pageNumber, text, blob, words) {
      if (!storyId || !blob) return;
      const hash = await hashText(text);
      const db = await openDb();
      const key = `aud:${storyId}:${pageNumber}:${hash}`;
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put({ blob, words: words || [], hash, text }, key);
      await txDone(tx);
    },

    async loadAudio(storyId, pageNumber, text) {
      if (!storyId) return null;
      const hash = await hashText(text);
      const db = await openDb();
      const key = `aud:${storyId}:${pageNumber}:${hash}`;
      return new Promise((resolve) => {
        const req = db.transaction('files').objectStore('files').get(key);
        req.onsuccess = () => {
          const row = req.result;
          if (!row) {
            resolve(null);
            return;
          }
          resolve({ blob: row.blob || row, words: row.words || [] });
        };
        req.onerror = () => resolve(null);
      });
    },

    async stats() {
      const stories = await this.listStories();
      let estimate = null;
      try {
        if (navigator.storage && navigator.storage.estimate) {
          estimate = await navigator.storage.estimate();
        }
      } catch (e) {
        estimate = null;
      }
      const usedMb = estimate && estimate.usage ? (estimate.usage / 1048576).toFixed(1) : null;
      return {
        storyCount: stories.length,
        usedMb,
        persisted: !!(navigator.storage && navigator.storage.persisted && await navigator.storage.persisted())
      };
    },

    async backupToServer(record) {
      await fetch('/api/vault/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          title: record.title,
          badge: record.badge,
          source: record.source,
          model: record.model,
          childName: record.childName,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          totalPages: record.totalPages,
          story: record.story
        })
      });
    },

    async hydrateFromServer() {
      try {
        const res = await fetch('/api/vault/stories');
        if (!res.ok) return;
        const data = await res.json();
        const rows = data.stories || [];
        if (!rows.length) return;
        const existing = await this.listStories();
        const have = {};
        existing.forEach((s) => { have[s.id] = true; });
        const db = await openDb();
        const tx = db.transaction('stories', 'readwrite');
        const store = tx.objectStore('stories');
        rows.forEach((row) => {
          if (row && row.id && !have[row.id]) store.put(row);
        });
        await txDone(tx);
      } catch (e) {
        // 서버가 없으면 이 브라우저 금고만 쓴다.
      }
    }
  };
})();
