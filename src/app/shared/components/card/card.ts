import { Component, DestroyRef, inject, model } from '@angular/core';
import { Quote } from '../../../core/models/quote.model';
import { QuoteCacheService } from '../../../core/services/quote-cache-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';

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

  setRating(star: number): void {
    const current = this.quote();
    if (!current) {
      return;
    }

    const newRating = current.rating === star ? undefined : star;
    const updated: Quote = { ...current, rating: newRating };

    this.quote.set(updated);
    this.updateQuote(updated);
  }

  clearRating(): void {
    const current = this.quote();
    if (!current || current.rating == null) {
      return;
    }

    const updated: Quote = { ...current, rating: undefined };
    this.updateQuote(updated);
  }

  share(): void {
    const quote = this.quote();
    if (!quote) {
      return;
    }

    const text = `“${quote.text}” — ${quote.author}`;

    if (navigator.share) {
      navigator.share({ title: quote.author, text });
    } else {
      window.open(`${environment.X_API}${encodeURIComponent(text)}`, '_blank');
    }
  }

  private updateQuote(quote: Quote): void {
    this.quote.set(quote);
    this.cache
      .saveQuote(quote)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
