import { DummyJsonQuote } from './dummy-json-quote.model';
import { ZenQuote } from './zen-quote.model';

export interface Quote {
  text: string;
  author: string;
  rating?: number;
}

export interface CachedQuote extends Quote {
  id?: number;
}

export function mapDummyQuote(dto: DummyJsonQuote): Quote {
  return {
    text: dto.quote,
    author: dto.author,
  };
}

export function mapZenQuote(dto: ZenQuote): Quote {
  return {
    text: dto.q,
    author: dto.a,
  };
}
