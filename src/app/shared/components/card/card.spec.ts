import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Card } from './card';
import { Quote } from '../../../core/models/quote.model';
import { of } from 'rxjs';
import { QuoteCacheService } from '../../../core/services/quote-cache-service';

class QuoteCacheServiceMock {
  saveQuote = vi.fn((q: Quote) => of(q));
}

describe('Card', () => {
  const mockQuote = { text: 'Cached wisdom', author: 'Test' };

  let fixture: ComponentFixture<Card>;
  let component: Card;
  let cache: QuoteCacheServiceMock;

  const setNavigatorShare = (shareImpl: ((data: any) => any) | undefined) => {
    Object.defineProperty(globalThis.navigator, 'share', {
      configurable: true,
      value: shareImpl,
    });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Card],
      providers: [
        { provide: QuoteCacheService, useClass: QuoteCacheServiceMock },
      ],
    });

    fixture = TestBed.createComponent(Card);
    component = fixture.componentInstance;
    cache = TestBed.inject(
      QuoteCacheService,
    ) as unknown as QuoteCacheServiceMock;

    setNavigatorShare(undefined);
  });

  it('should render quote text and author', () => {
    component.quote.set(mockQuote);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain(mockQuote.text);
    expect(el.textContent).toContain(mockQuote.author);
  });

  it('should show fallback message when no quote is provided', () => {
    component.quote.set(null as any);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No quote available');
  });

  it('setRating should set rating, persist, and toggle off when same star is clicked', () => {
    component.quote.set({ ...mockQuote, rating: undefined });

    component.setRating(4);

    expect(component.quote()).toEqual({ ...mockQuote, rating: 4 });
    expect(cache.saveQuote).toHaveBeenCalledTimes(1);
    expect(cache.saveQuote).toHaveBeenCalledWith({ ...mockQuote, rating: 4 });

    cache.saveQuote.mockClear();

    component.setRating(4);

    expect(component.quote()).toEqual({ ...mockQuote, rating: undefined });
    expect(cache.saveQuote).toHaveBeenCalledTimes(1);
    expect(cache.saveQuote).toHaveBeenCalledWith({
      ...mockQuote,
      rating: undefined,
    });
  });

  it('clearRating should clear an existing rating and persist', () => {
    component.quote.set({ ...mockQuote, rating: 5 });

    component.clearRating();

    expect(component.quote()).toEqual({ ...mockQuote, rating: undefined });
    expect(cache.saveQuote).toHaveBeenCalledTimes(1);
    expect(cache.saveQuote).toHaveBeenCalledWith({
      ...mockQuote,
      rating: undefined,
    });
  });

  it('clearRating should no-op when quote is null or has no rating', () => {
    component.quote.set(null as any);
    component.clearRating();
    expect(cache.saveQuote).not.toHaveBeenCalled();

    component.quote.set({ ...mockQuote, rating: undefined });
    component.clearRating();
    expect(cache.saveQuote).not.toHaveBeenCalled();
  });

  it('share should use navigator.share when available', () => {
    const shareSpy = vi.fn();
    setNavigatorShare(shareSpy);
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null as any);

    component.quote.set(mockQuote);
    component.share();

    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledWith({
      title: mockQuote.author,
      text: `“${mockQuote.text}” — ${mockQuote.author}`,
    });
    expect(openSpy).not.toHaveBeenCalled();

    openSpy.mockRestore();
  });

  it('share should fall back to opening X intent URL when navigator.share is not available', () => {
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null as any);

    component.quote.set(mockQuote);
    component.share();

    expect(openSpy).toHaveBeenCalledTimes(1);

    const [url, target] = openSpy.mock.calls[0];
    expect(target).toBe('_blank');
    expect(String(url)).toContain('twitter.com/intent/tweet?text=');

    const expectedText = encodeURIComponent(
      `“${mockQuote.text}” — ${mockQuote.author}`,
    );
    expect(String(url)).toContain(expectedText);

    openSpy.mockRestore();
  });

  it('share should no-op when quote is null', () => {
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null as any);
    const shareSpy = vi.fn();
    setNavigatorShare(shareSpy);

    component.quote.set(null as any);
    component.share();

    expect(shareSpy).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();

    openSpy.mockRestore();
  });
});
