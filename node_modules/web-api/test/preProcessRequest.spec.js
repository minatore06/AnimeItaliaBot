const expect = require('chai').expect;

import { createAPI } from '../src';
import TestAPI from './TestAPI';
import createRequest from '../src/createRequest';

const queryParams = {
  hello: 'world'
};

const queryParamMappings = {
  hello: 'whats-up'
};

const params = {
  body: {
    hello: 'world'
  }
};

const reqOptions = {
  schema: 'FOO'
};

const requestObjBase = createRequest('get', createAPI(TestAPI), '/posts');
const requestObjExtended = createRequest('get', createAPI(TestAPI), '/posts', {
  queryParams: queryParams,
  queryParamMappings: queryParamMappings,
  params: params,
}, reqOptions);

let Context = {
  testAPI: null
};

describe('CreateRequest', () => {

  it('should have the proper shape', () => {
    expect(requestObjBase).to.contain.all.keys(requestObjBase);
  });

  it('should have the proper method in its params', () => {
    expect(requestObjBase.params.method).to.equal('GET');
  });

  it('should have the passed in queryParams', () => {
    expect(requestObjBase.queryParams).to.contain({});
    expect(requestObjExtended.queryParams).to.contain(queryParams);
  });

  it('should have the passed in queryParamMappings', () => {
    expect(requestObjBase.queryParamMappings).to.contain({});
    expect(requestObjExtended.queryParamMappings).to.contain(queryParamMappings);
  });

  it('should have the passed in reqOptions', () => {
    expect(requestObjBase.reqOptions).to.contain({});
    expect(requestObjExtended.reqOptions).to.contain(reqOptions);
  });

  it('should have the passed in params', () => {
    expect(requestObjBase.params).to.contain.keys('headers', 'method');
    expect(requestObjExtended.params).to.contain(params);
  });

  it('should overwrite passed in params.method with passed in method', () => {
    const reqObj = createRequest('post', TestAPI, '/posts', {
      params: {method: 'get'}});

    expect(reqObj.params.method)
      .to.equal('POST');
  });

  it('should add the global headers to params', () => {
    expect(requestObjBase.params).to.contain.key('headers');
    expect(requestObjBase.params.headers).to.contain({'Custom-Header': 'foo'});
  });

});

describe('Preprocess Request', () => {

    beforeEach(() => {
      Context.testAPI = createAPI(TestAPI);
    });

    it('should add the full `fetchUrl` to the request', () => {
      const preProcReq = Context.testAPI._preProcessRequest(requestObjBase);

      expect(preProcReq.returnValue.fetchUrl)
        .to.equal('http://example.com/tests/posts');
    });

    it('should add the full `fetchUrl` with query params to the request', () => {
      const preProcExtendedReq = Context.testAPI._preProcessRequest(
        createRequest('get', Context.testAPI, '/posts', {queryParams: queryParams}));

      expect(preProcExtendedReq.returnValue.fetchUrl)
        .to.equal('http://example.com/tests/posts?hello=world');
    });

    it('should add the full `fetchUrl` with mapped query params to the request', () => {
      const preProcExtendedMappedReq =
        Context.testAPI._preProcessRequest(requestObjExtended);

      expect(preProcExtendedMappedReq.returnValue.fetchUrl)
        .to.equal('http://example.com/tests/posts?whats-up=world');
    });

});
