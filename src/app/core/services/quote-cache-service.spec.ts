import { TestBed } from '@angular/core/testing';
import { QuoteCacheService } from './quote-cache-service';
import { firstValueFrom } from 'rxjs';
import { Quote } from '../models/quote.model';

type Calls = {
  api?: number;
  cacheGet?: number;
  cacheSave?: any | null;
  fallback?: number;
};

const expectIdleState = (store: any, quote: any) => {
  expect(quote).toBeTruthy();
  expect(store.currentQuote()).toEqual(quote);
  expect(store.loading()).toBe(false);
  expect(store.error()).toBeNull();
};

const expectCalls = (
  deps: {
    api: any;
    cache: any;
    fallbackSpy?: any;
  },
  calls: Calls,
) => {
  const { api, cache, fallbackSpy } = deps;

  expect(api.getRandomQuote).toHaveBeenCalledTimes(calls.api ?? 0);
  expect(cache.getQuote).toHaveBeenCalledTimes(calls.cacheGet ?? 0);

  if (calls.cacheSave === null) {
    expect(cache.saveQuote).not.toHaveBeenCalled();
  } else if (calls.cacheSave !== undefined) {
    expect(cache.saveQuote).toHaveBeenCalledWith(calls.cacheSave);
  }

  if (fallbackSpy) {
    expect(fallbackSpy).toHaveBeenCalledTimes(calls.fallback ?? 0);
  }
};

describe('QuoteCacheService', () => {
  const mockQuote: Quote = {
    text: 'Cached wisdom',
    author: 'Test',
  };

  let service: QuoteCacheService;

  let store: { add: ReturnType<typeof vi.fn> };
  let txProxy: any;
  let txStarted!: Promise<void>;
  let resolveTxStarted!: () => void;
  let db: any;
  let count: number;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [QuoteCacheService] });
    service = TestBed.inject(QuoteCacheService);

    count = 0;
    store = { add: vi.fn() };

    const tx: any = { objectStore: vi.fn(() => store) };
    txProxy = {
      objectStore: tx.objectStore,
      oncomplete: null,
      onerror: null,
      onabort: null,
      error: null,
    };

    txStarted = new Promise<void>((resolve) => {
      resolveTxStarted = resolve;
    });

    db = {
      transaction: vi.fn(() => {
        resolveTxStarted();
        return txProxy;
      }),
    };

    vi.spyOn(service as any, 'openDb').mockResolvedValue(db);
    vi.spyOn(service as any, 'getCount').mockImplementation(async () => count);
  });

  it('saveQuote should delegate to saveQuoteToDb and return the same quote', async () => {
    const saveSpy = vi
      .spyOn(service as any, 'saveQuoteToDb')
      .mockResolvedValue(undefined);

    const result = await firstValueFrom(service.saveQuote(mockQuote));

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(mockQuote);
    expect(result).toEqual(mockQuote);
  });

  it('getQuote should return null when there are no cached quotes', async () => {
    vi.spyOn(service as any, 'getAllFromDb').mockResolvedValue([]);

    const result = await firstValueFrom(service.getQuote());

    expect(result).toBeNull();
  });

  it('getQuote should return a quote when there are cached quotes', async () => {
    const cached: any[] = [mockQuote];

    vi.spyOn(service as any, 'getAllFromDb').mockResolvedValue(cached);

    const result = await firstValueFrom(service.getQuote());

    expect(result).toEqual<Quote>(mockQuote);
  });

  it('getQuote should pick a random cached quote (and strip id)', async () => {
    const cached: any[] = [
      { id: 1, text: 'First', author: 'A' },
      { id: 2, text: 'Second', author: 'B' },
    ];

    vi.spyOn(service as any, 'getAllFromDb').mockResolvedValue(cached);
    const randSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = await firstValueFrom(service.getQuote());

    expect(result).toEqual<Quote>({
      text: 'Second',
      author: 'B',
    });

    randSpy.mockRestore();
  });

  it('saveQuoteToDb should not write when cache cap is reached', async () => {
    count = Number.MAX_SAFE_INTEGER;

    await (service as any).saveQuoteToDb(mockQuote);

    expect(db.transaction).not.toHaveBeenCalled();
    expect(store.add).not.toHaveBeenCalled();
  });

  it('saveQuoteToDb should write when under cap', async () => {
    const p = (service as any).saveQuoteToDb(mockQuote);

    await txStarted; // <- wait until the code actually reaches db.transaction()

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(store.add).toHaveBeenCalledTimes(1);
    expect(store.add).toHaveBeenCalledWith({ ...mockQuote });

    txProxy.oncomplete?.();
    await p;
  });

  it('saveQuoteToDb should reject when the transaction errors', async () => {
    const p = (service as any).saveQuoteToDb(mockQuote);

    await txStarted;

    txProxy.error = new Error('tx failed');
    txProxy.onerror?.(new Event('error'));

    await expect(p).rejects.toBeTruthy();
  });
});
