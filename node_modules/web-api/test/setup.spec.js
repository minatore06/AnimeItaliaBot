const expect = require('chai').expect;

import { createAPI } from '../src';
import TestAPI from './TestAPI';

let Context = {
  testAPI: null
};

describe('Class setup', () => {

  beforeEach(() => {
    Context.testAPI = createAPI(TestAPI);
  });

  it('should have any passed global headers', () => {
    expect(Context.testAPI.globalHeaders).to.contain({'Custom-Header': 'foo'});
  });

  it('should have the proper host', () => {
    expect(Context.testAPI.host).to.equal('example.com');
  });

  it('should have the proper base endpoint url', () => {
    expect(Context.testAPI.baseEndpointURL).to.equal('tests');
  });

  it('should have the proper url protocol', () => {
    expect(Context.testAPI.protocol).to.equal('http');
  });

  it('should have the base url (<protocol>://<host>/<base endpoint url>) or <protocol>://<host>', () => {
    expect(Context.testAPI.baseURL).to.equal('http://example.com/tests');
  });

});
