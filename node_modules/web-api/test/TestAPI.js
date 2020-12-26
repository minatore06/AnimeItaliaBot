import { BaseWebAPI } from '../src';

class TestAPI extends BaseWebAPI {

  constructor(options) {

    const customOptions = Object.assign({
      headers        : {'Custom-Header': 'foo'},
      host           : 'example.com',
      protocol       : 'http',
      baseEndpointURL: '/tests/',
    }, options || {});

    super(customOptions);

  }

  async asyncGet(url) {
    return await this.get(url);
  }

  promiseGet() {
    return this.get('/posts');
  }

}

export default TestAPI;
