const expect = require('chai').expect;
const mockFetch = require('fetch-mock');

import { createAPI } from '../src';
import TestAPI from './TestAPI';

const mockedResponse = {
  'userId': 1,
  'id'    : 1,
  'title' : 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
  'body'  : 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto'
};

const metaData = {
  baseURL: 'http://example.com/tests',
  baseEndpointURL: 'tests'
};

const parsedRequestURLObj = {
  protocol: 'http:',
  slashes: true,
  hash: '',
  query: '',
  pathname: '/tests/posts/1',
  auth: '',
  host: 'example.com',
  port: '',
  hostname: 'example.com',
  password: '',
  username: '',
  href: 'http://example.com/tests/posts/1'
};

let Context = {
  testAPI: null
};

describe('Async GET', () =>  {

  beforeEach(() => {
    mockFetch.mock('http://example.com/tests/posts/1',
      'GET', { status: 200, body: mockedResponse });

      Context.testAPI = createAPI(TestAPI)
  });

  it('should return the proper response', async () =>  {
    let response = await Context.testAPI.asyncGet('/posts/1');

    expect(response).to.contain(mockedResponse);
  });

  it('should return the proper metadata', async () =>  {
    let response = await Context.testAPI.asyncGet('/posts/1');

    expect(response._metadata).to.contain(metaData);
    expect(response._metadata.parsedRequestURL).to.contain(parsedRequestURLObj);
  });

});
