# Angular Quotes App

Small Angular 21 app built as a coding assignment.  
It fetches random quotes from multiple providers, handles offline usage, and lets the user rate and share quotes.

## Tech stack

- Angular 21 (standalone components, signals, modern control flow)
- RxJS
- Tailwind CSS
- IndexedDB for quote caching (via a small cache service)
- Vitest / Angular test utilities for unit tests

## Features

- Fetches random quotes from multiple APIs and races them:
  - DummyJSON
  - ZenQuotes
- Normalizes both into a single `Quote` model
- Uses `race` and fallback logic so the fastest provider wins
- Handles failures:
  - If all providers fail → fallback to cached quotes
  - If cache is empty → fallback to local hardcoded quotes
- Offline-aware:
  - Detects `navigator.onLine === false` and skips HTTP calls
  - Uses cache / local fallback only when offline
- Caching:
  - Quotes are stored in IndexedDB
  - Simple cap (e.g. 200 quotes) to avoid unbounded growth
- Slideshow:
  - Optional auto-advance mode that loads new random quotes on an interval
- Rating:
  - User can rate each quote (1–5 stars)
  - Rating is stored along with the quote in cache
  - Clicking the same star again clears the rating
- Sharing:
  - Uses `navigator.share` when available
  - Falls back to a Twitter share URL otherwise

## Architecture

Basic feature-first structure:

```txt
src/app/
  core/
    models/              # Quote, provider-specific models
    services/            # API service, cache service
  features/
    quotes/
      quotes-component/  # Main quotes screen
      store/             # QuotesStore (signals + RxJS boundary)
      models/            # Feature-specific view models if needed
  shared/
    components/
      card/              # Quote display card (rating + share)
      button/            # Reusable button with Tailwind styling
```

**QuoteApiService**

- Calls the external APIs
- Maps provider-specific responses into Quote
- Uses race(dummy$, zen$) with fail-safe error handling

**QuoteCacheService**

- Wraps IndexedDB access
- Stores and retrieves quotes
- Applies a hard cap on number of stored quotes

**QuotesStore**

- Orchestrates: API → cache → fallback
- Exposes signals: currentQuote, loading, error
- Provides loadRandomQuote() used by the component and slideshow

**QuotesComponent**

- Displays the current quote in a Card
- Handles slideshow toggling and manual “Next quote”
- Displays loading and error states

### Running the project

```bash
npm install
npm run start
```

The app is available at http://localhost:4200 by default.

### Running tests

```bash
npm test
```

> NOTE:
>
> - The app avoids making HTTP calls when offline (navigator.onLine === false) and directly falls back to cached / local quotes.
> - Styling uses Tailwind utility classes only; no global CSS frameworks.
>
> API issues to NOTE:
> 1. https://pprathameshmore.github.io moved to an npm library `@pprathameshmore/quotegardennpm@1.1.0` defeating a purpose of the assigment
> 2. https://api.quotable.io/random - there SSL peer certificate is not OK
> 3. https://type.fit/api/quotes - no longer up
> 4. https://quote-garden.onrender.com/api/v3/quotes/random - Service has been suspended
> 5. https://zenquotes.io/api/random - Up but it's CORS configuration is blocking localhost
> 
> - I could not find any more public quote API's.
> 
> For the purpose of this task, I chose https://zenquotes.io/api/random as the least problematic option.
>
> While it occasionally triggers a CORS warning in the browser during local development, this does not affect application functionality.
> 
> This behavior was intentionally left visible to demonstrate graceful degradation, provider 
> racing, and offline/cache fallback handling.
