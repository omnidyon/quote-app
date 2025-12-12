import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { QuoteApiService } from './quote-api-service';
import { environment } from '../../../environments/environment.development';
import { firstValueFrom } from 'rxjs';
import { Quote } from '../models/quote.model';

describe('QuoteApiService', () => {
  const providersFailedMsg = 'Both quote providers failed';
  const mockQuote: Quote = {
    text: 'Cached wisdom',
    author: 'Test',
  };

  const expectProviderRequests = () => {
    const dummyReq = http.expectOne((req) =>
      req.url.includes(environment.DUMMY_API),
    );
    const zenReq = http.expectOne((req) =>
      req.url.includes(environment.ZEN_API),
    );
    return { dummyReq, zenReq };
  };

  let service: QuoteApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(QuoteApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should return a normalized quote when dummyjson responds', async () => {
    const quotePromise = firstValueFrom(service.getRandomQuote());

    const { dummyReq } = expectProviderRequests();

    dummyReq.flush({
      quote: 'Hello world',
      author: 'Someone',
    });

    const result = await quotePromise;

    expect(result).toEqual({
      text: 'Hello world',
      author: 'Someone',
    });
  });

  it('should return a normalized quote when zenquotes responds', async () => {
    const quotePromise = firstValueFrom(service.getRandomQuote());

    const { zenReq } = expectProviderRequests();

    zenReq.flush([
      {
        q: mockQuote.text,
        a: mockQuote.author,
      },
    ]);

    const result = await quotePromise;

    expect(result).toEqual(mockQuote);
  });

  it('should error and cancel zenquotes request when dummyjson errors first', async () => {
    const quotePromise = firstValueFrom(service.getRandomQuote());
    const assertion = expect(quotePromise).rejects.toThrow(providersFailedMsg);

    const { dummyReq, zenReq } = expectProviderRequests();

    dummyReq.error(new ProgressEvent('error'));

    // race() completes on the first completion, so the other request gets cancelled
    expect(zenReq.cancelled).toBe(true);

    await assertion;
  });

  it('should error and cancel dummyjson request when zenquotes errors first', async () => {
    const quotePromise = firstValueFrom(service.getRandomQuote());
    const assertion = expect(quotePromise).rejects.toThrow(providersFailedMsg);

    const { dummyReq, zenReq } = expectProviderRequests();

    zenReq.error(new ProgressEvent('error'));

    expect(dummyReq.cancelled).toBe(true);

    await assertion;
  });

  it('should error when zenquotes returns an empty list (no quote)', async () => {
    const quotePromise = firstValueFrom(service.getRandomQuote());
    const assertion = expect(quotePromise).rejects.toThrow(providersFailedMsg);

    const { dummyReq, zenReq } = expectProviderRequests();

    zenReq.flush([]);

    expect(dummyReq.cancelled).toBe(true);

    await assertion;
  });
});
