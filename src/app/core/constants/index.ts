import { Quote } from "../models/quote.model";

export const DB_NAME = 'quotes-db';
export const DB_VERSION = 1;
export const STORE_NAME = 'quotes';
export const MAX_CACHED_QUOTES = 200;
export const RATINGS_STORE = 'ratings';

export const LOCAL_QUOTE: Quote = {
  text: 'Even offline, you still get wisdom. Hardcoded, but still.',
  author: 'Local Fallback',
};
