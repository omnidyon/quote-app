import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError, switchMap, of } from 'rxjs';
import { Quote } from '../../../core/models/quote.model';
import { QuoteApiService } from '../../../core/services/quote-api-service';
import { QuoteCacheService } from '../../../core/services/quote-cache-service';
import { LOCAL_QUOTE } from '../../../core/constants';

@Injectable({
  providedIn: 'root',
})
export class QuotesStore {
  private quoteApi = inject(QuoteApiService);
  private quoteCache = inject(QuoteCacheService);

  readonly currentQuote = signal<Quote | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadRandomQuote(): Observable<Quote> {
    this.loading.set(true);
    this.error.set(null);

    return this.getQuoteWithFallback().pipe(
      tap((quote) => {
        this.currentQuote.set(quote);
        this.loading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message ?? 'Failed to load quote');
        this.loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  private getQuoteWithFallback(): Observable<Quote> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.fallbackToCached();
    }

    return this.quoteApi.getRandomQuote().pipe(
      switchMap((quote) => this.quoteCache.saveQuote(quote)),
      catchError(() => this.fallbackToCached()),
    );
  }

  private fallbackToCached(): Observable<Quote> {
    return this.quoteCache
      .getQuote()
      .pipe(
        switchMap((cached) =>
          cached
            ? of(cached)
            : this.quoteCache.saveQuote(LOCAL_QUOTE),
        ),
      );
  }
}
