import { Component, DestroyRef, inject, model } from '@angular/core';
import { Quote } from '../../../core/models/quote.model';
import { QuoteCacheService } from '../../../core/services/quote-cache-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {
  quote = model.required<Quote | null>();
  private cache = inject(QuoteCacheService);
  private readonly destroyRef = inject(DestroyRef);

  setRating(star: number) {
    const current = this.quote();
    if (!current) {
      return;
    }

    const newRating = current.rating === star ? undefined : star;
    const updated: Quote = { ...current, rating: newRating };

    this.quote.set(updated);

    this.cache
      .saveQuote(updated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  clearRating() {
    const current = this.quote();
    if (!current || current.rating == null) {
      return;
    }

    const updated: Quote = { ...current, rating: undefined };
    this.quote.set(updated);
    this.cache
      .saveQuote(updated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  share() {
    const quote = this.quote();
    if (!quote) {
      return;
    }

    const text = `“${quote.text}” — ${quote.author}`;

    if (navigator.share) {
      navigator.share({ title: quote.author, text });
    } else {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        '_blank',
      );
    }
  }
}
