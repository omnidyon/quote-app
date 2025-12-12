import { TestBed } from '@angular/core/testing';
import { QuotesStore } from './quotes-store';
import { of, firstValueFrom, throwError } from 'rxjs';
import { Quote } from '../../../core/models/quote.model';
import { QuoteApiService } from '../../../core/services/quote-api-service';
import { QuoteCacheService } from '../../../core/services/quote-cache-service';

class QuoteApiServiceMock {
  getRandomQuote = vi.fn();
}

class QuoteCacheServiceMock {
  getQuote = vi.fn();
  saveQuote = vi.fn();
}

describe('QuotesStore', () => {
  const mockQuote: Quote = {
    text: 'Cached wisdom',
    author: 'Test',
  };

  const expectStoreSettledWith = (expected: Quote) => {
    expect(store.currentQuote()).toEqual(expected);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  };

  const expectCalls = (opts: {
    api?: number;
    cacheGet?: number;
    cacheSave?: Quote | null;
    fallback?: number;
    fallbackSpy?: ReturnType<typeof vi.spyOn>;
  }) => {
    expect(api.getRandomQuote).toHaveBeenCalledTimes(opts.api ?? 0);
    expect(cache.getQuote).toHaveBeenCalledTimes(opts.cacheGet ?? 0);

    if (opts.cacheSave === null) {
      expect(cache.saveQuote).not.toHaveBeenCalled();
    } else if (opts.cacheSave !== undefined) {
      expect(cache.saveQuote).toHaveBeenCalledWith(opts.cacheSave);
    }

    if (opts.fallbackSpy) {
      expect(opts.fallbackSpy).toHaveBeenCalledTimes(opts.fallback ?? 0);
    }
  };

  let store: QuotesStore;
  let api: QuoteApiServiceMock;
  let cache: QuoteCacheServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QuotesStore,
        { provide: QuoteApiService, useClass: QuoteApiServiceMock },
        { provide: QuoteCacheService, useClass: QuoteCacheServiceMock },
      ],
    });

    store = TestBed.inject(QuotesStore);
    api = TestBed.inject(QuoteApiService) as unknown as QuoteApiServiceMock;
    cache = TestBed.inject(
      QuoteCacheService,
    ) as unknown as QuoteCacheServiceMock;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should load quote from API and cache it', async () => {
    api.getRandomQuote.mockReturnValue(of(mockQuote));
    cache.saveQuote.mockReturnValue(of(mockQuote));

    const result = await firstValueFrom(store.loadRandomQuote());

    expect(result).toEqual(mockQuote);
    expectStoreSettledWith(mockQuote);
    expectCalls({ api: 1, cacheSave: mockQuote });
  });

  it('should fall back to cached quote when API fails', async () => {
    api.getRandomQuote.mockReturnValue(throwError(() => new Error('API down')));
    cache.getQuote.mockReturnValue(of(mockQuote));
    cache.saveQuote.mockReturnValue(of(mockQuote));

    const result = await firstValueFrom(store.loadRandomQuote());

    expect(result).toEqual(mockQuote);
    expectStoreSettledWith(mockQuote);
    expectCalls({ api: 1, cacheGet: 1, cacheSave: null });
  });

  it('should use local fallback and cache it when API and cache are empty', async () => {
    api.getRandomQuote.mockReturnValue(throwError(() => new Error('API down')));
    cache.getQuote.mockReturnValue(of(null));

    const fallbackSpy = vi
      .spyOn(store as any, 'getLocalFallbackQuote')
      .mockReturnValue(mockQuote);

    cache.saveQuote.mockReturnValue(of(mockQuote));

    const result = await firstValueFrom(store.loadRandomQuote());

    expect(result).toEqual(mockQuote);
    expectStoreSettledWith(mockQuote);
    expectCalls({
      api: 1,
      cacheGet: 1,
      cacheSave: mockQuote,
      fallback: 1,
      fallbackSpy,
    });
  });
});
