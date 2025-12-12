import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { QuotesStore } from '../store/quotes-store';
import { Card } from '../../../shared/components/card/card';
import { Subscription, exhaustMap, interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Button } from '../../../shared/components/button/button';

@Component({
  selector: 'app-quotes',
  imports: [CommonModule, Card, Button],
  templateUrl: './quotes.html',
  styleUrl: './quotes.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quotes {
  slideshowOn = false;

  readonly store = inject(QuotesStore);
  readonly currentQuote = this.store.currentQuote;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  private slideshowSub: Subscription | null = null;

  constructor() {
    this.store.loadRandomQuote().subscribe();
  }

  nextQuote(): void {
    if (this.loading()) {
      return;
    }
    this.store.loadRandomQuote().subscribe();
  }

  toggleSlideshow(): void {
    if (this.slideshowOn) {
      this.stopSlideshow();
      return;
    }

    this.slideshowOn = true;
    this.slideshowSub = interval(8000)
      .pipe(exhaustMap(() => this.store.loadRandomQuote()))
      .subscribe();
  }

  private stopSlideshow(): void {
    this.slideshowOn = false;
    this.slideshowSub?.unsubscribe();
    this.slideshowSub = null;
  }
}
