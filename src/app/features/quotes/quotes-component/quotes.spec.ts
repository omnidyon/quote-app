import { TestBed } from '@angular/core/testing';
import { Quotes } from './quotes';
import { of } from 'rxjs';
import { Quote } from '../../../core/models/quote.model';
import { QuotesStore } from '../store/quotes-store';

class QuotesStoreMock {
  static loadingValue = false;
  static currentQuoteValue: Quote | null = null;
  static errorValue: string | null = null;

  currentQuote = () => QuotesStoreMock.currentQuoteValue;
  loading = () => QuotesStoreMock.loadingValue;
  error = () => QuotesStoreMock.errorValue;

  loadRandomQuote = vi.fn().mockReturnValue(
    of<Quote>({
      text: 'Test quote',
      author: 'Tester',
    }),
  );
}

describe('Quotes', () => {
  beforeEach(async () => {
    QuotesStoreMock.loadingValue = false;
    QuotesStoreMock.currentQuoteValue = null;
    QuotesStoreMock.errorValue = null;

    await TestBed.configureTestingModule({
      imports: [Quotes],
      providers: [{ provide: QuotesStore, useClass: QuotesStoreMock }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Quotes);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load a quote on construction', () => {
    TestBed.createComponent(Quotes);
    const store = TestBed.inject(QuotesStore) as unknown as QuotesStoreMock;
    expect(store.loadRandomQuote).toHaveBeenCalledTimes(1);
  });

  it('nextQuote should not fetch when loading is true', () => {
    QuotesStoreMock.loadingValue = true;
    const fixture = TestBed.createComponent(Quotes);
    const component = fixture.componentInstance;
    const store = TestBed.inject(QuotesStore) as unknown as QuotesStoreMock;

    store.loadRandomQuote.mockClear();
    component.nextQuote();

    expect(store.loadRandomQuote).not.toHaveBeenCalled();
  });

  it('nextQuote should fetch when not loading', () => {
    QuotesStoreMock.loadingValue = false;
    const fixture = TestBed.createComponent(Quotes);
    const component = fixture.componentInstance;
    const store = TestBed.inject(QuotesStore) as unknown as QuotesStoreMock;

    store.loadRandomQuote.mockClear();
    component.nextQuote();

    expect(store.loadRandomQuote).toHaveBeenCalledTimes(1);
  });

  it('toggleSlideshow should start fetching every 8s and stop on second toggle', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(Quotes);
    const component = fixture.componentInstance;
    const store = TestBed.inject(QuotesStore) as unknown as QuotesStoreMock;

    store.loadRandomQuote.mockClear();

    component.toggleSlideshow();
    expect(component.slideshowOn).toBe(true);

    vi.advanceTimersByTime(8000 * 3);
    expect(store.loadRandomQuote).toHaveBeenCalledTimes(3);

    component.toggleSlideshow();
    expect(component.slideshowOn).toBe(false);

    vi.advanceTimersByTime(8000 * 3);
    expect(store.loadRandomQuote).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});
