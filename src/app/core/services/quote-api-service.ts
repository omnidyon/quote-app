import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Observable,
  map,
  catchError,
  EMPTY,
  race,
  switchMap,
  of,
  throwIfEmpty,
} from 'rxjs';
import { mapDummyQuote, mapZenQuote, Quote } from '../models/quote.model';
import { DummyJsonQuote } from '../models/dummy-json-quote.model';
import { ZenQuote } from '../models/zen-quote.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class QuoteApiService {
  private http = inject(HttpClient);

  getRandomQuote(): Observable<Quote> {
    const dummy$ = this.http
      .get<DummyJsonQuote>(`${environment.DUMMY_API}/random`)
      .pipe(
        map((res) => mapDummyQuote(res)),
        catchError(() => EMPTY),
      );

    const zen$ = this.http
      .get<ZenQuote[]>(`${environment.ZEN_API}/random`)
      .pipe(
        map((res) => res[0]),
        switchMap((item) => (item ? of(mapZenQuote(item)) : EMPTY)),
        catchError(() => EMPTY),
      );

    return race(dummy$, zen$).pipe(
      throwIfEmpty(() => new Error('Both quote providers failed')),
    );
  }
}
