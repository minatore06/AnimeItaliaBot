const expect = require('chai').expect;

import { createAPI } from '../src';
import TestAPI from './TestAPI';

const body = {hello: 'world'};
const mockRequestObj = {fetchUrl: 'http://example.com/tests/posts?hello=world'};

const metaData = {
  baseURL: 'http://example.com/tests',
  baseEndpointURL: 'tests'
};

const parsedRequestURLObj = {
  protocol: 'http:',
  slashes: true,
  hash: '',
  query: '?hello=world',
  pathname: '/tests/posts',
  auth: '',
  host: 'example.com',
  port: '',
  hostname: 'example.com',
  password: '',
  username: '',
  href: 'http://example.com/tests/posts?hello=world'
};

let Context = {
  testAPI: null,
  responseObj: null
};

describe('Postprocess request', () => {

  beforeEach(() => {
    Context.testAPI = createAPI(TestAPI);
    Context.responseObj = new Response(body);
  });

  it('Should unpack the json response', () => {
    Context.testAPI._unpackResponse(Context.responseObj)
      .then(
        (response) => {
          expect(response.returnValue).to.equal(body)
        }
      );
  });

  it('should add metadata to the response object', () => {
    const response = Context.testAPI._postProcessResponse(body, mockRequestObj);

    expect(response.returnValue._metadata).to.contain(metaData);
    expect(response.returnValue._metadata.parsedRequestURL)
      .to.contain(parsedRequestURLObj);
  });

});
