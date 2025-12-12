import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Quote, CachedQuote } from '../models/quote.model';
import {
  DB_NAME,
  DB_VERSION,
  MAX_CACHED_QUOTES,
  STORE_NAME,
} from '../constants';

@Injectable({
  providedIn: 'root',
})
export class QuoteCacheService {
  saveQuote(quote: Quote): Observable<Quote> {
    return from(this.saveQuoteToDb(quote)).pipe(map(() => quote));
  }

  getQuote(): Observable<Quote | null> {
    return from(this.getAllFromDb()).pipe(
      map((items) => {
        if (!items.length) {
          return null;
        }

        const idx = Math.floor(Math.random() * items.length);
        const { id: _id, ...quote } = items[idx];
        return quote;
      }),
    );
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveQuoteToDb(quote: Quote): Promise<void> {
    const db = await this.openDb();
    const count = await this.getCount(db);

    if (count >= MAX_CACHED_QUOTES) {
      return;
    }

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data: CachedQuote = { ...quote };
    store.add(data);

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  private async getAllFromDb(): Promise<CachedQuote[]> {
    const db = await this.openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll() as IDBRequest<CachedQuote[]>;

    return new Promise<CachedQuote[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private getCount(db: IDBDatabase): Promise<number> {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();

    return new Promise<number>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? 0);
      request.onerror = () => reject(request.error);
    });
  }
}
