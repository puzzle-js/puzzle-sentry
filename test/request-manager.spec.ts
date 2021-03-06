import "reflect-metadata";

import {expect} from "chai";
import sinon, {SinonMock} from "sinon";
import {RequestManager, WardenRequestOptions, RouteConfiguration} from "../src/request-manager";
import {CacheFactory} from "../src/cache-factory";
import {StreamFactory, StreamType} from "../src/stream-factory";
import {Tokenizer} from "../src/tokenizer";
import faker from "faker";

const sandbox = sinon.createSandbox();

const cacheFactory = new CacheFactory();
const streamFactory = new StreamFactory(cacheFactory);
const tokenizer = new Tokenizer();


let streamFactoryMock: SinonMock;
let tokenizerMock: SinonMock;
let requestManager: RequestManager;

describe("[request-manager]", () => {
  beforeEach(() => {
    streamFactoryMock = sandbox.mock(streamFactory);
    tokenizerMock = sandbox.mock(tokenizer);

    requestManager = new RequestManager(streamFactory, tokenizer);
  });

  afterEach(() => {
    sandbox.verifyAndRestore();
  });

  it("should create new Request Manager", () => {
    // Arrange
    const requestManager = new RequestManager(streamFactory, tokenizer);

    // Assert
    expect(requestManager).to.be.instanceOf(RequestManager);
  });

  it("should register new route without any plugin", () => {
    // Arrange
    const name = faker.random.word();
    const routeConfiguration = {
      identifier: faker.random.word()
    } as RouteConfiguration;
    const headStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const networkStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const keyMaker = sandbox.stub();
    streamFactoryMock.expects('createHead').withExactArgs().returns(headStream);
    streamFactoryMock.expects('createNetwork').withExactArgs(name).returns(networkStream);
    tokenizerMock.expects('tokenize').withExactArgs(name, routeConfiguration.identifier).returns(keyMaker);

    // Act
    requestManager.register(name, routeConfiguration);

    // Assert
    expect(headStream.connect.calledWithExactly(networkStream)).to.eq(true);
  });

  it("should register new route without any identifier", () => {
    // Arrange
    const name = faker.random.word();
    const routeConfiguration = {} as RouteConfiguration;
    const headStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const networkStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const keyMaker = sandbox.stub();
    streamFactoryMock
      .expects('createHead')
      .withExactArgs()
      .returns(headStream);
    streamFactoryMock
      .expects('createNetwork')
      .withExactArgs(name)
      .returns(networkStream);
    tokenizerMock
      .expects('tokenize')
      .withExactArgs(name, undefined)
      .returns(keyMaker);

    // Act
    requestManager.register(name, routeConfiguration);

    // Assert
    expect(headStream.connect.calledWithExactly(networkStream)).to.eq(true);
  });

  it("should register new route without any plugin with boolean false", () => {
    // Arrange
    const name = faker.random.word();
    const routeConfiguration = {
      identifier: faker.random.word(),
      cache: false,
      holder: false
    } as RouteConfiguration;
    const headStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const networkStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const keyMaker = sandbox.stub();
    streamFactoryMock.expects('createHead').withExactArgs().returns(headStream);
    streamFactoryMock.expects('createNetwork').withExactArgs(name).returns(networkStream);
    tokenizerMock.expects('tokenize').withExactArgs(name, routeConfiguration.identifier).returns(keyMaker);

    // Act
    requestManager.register(name, routeConfiguration);

    // Assert
    expect(headStream.connect.calledWithExactly(networkStream)).to.eq(true);
  });

  it("should register new route with a plugin", () => {
    // Arrange
    const name = faker.random.word();
    const routeConfiguration = {
      identifier: faker.random.word(),
      cache: true
    } as RouteConfiguration;
    const headStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const networkStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const cacheStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const keyMaker = sandbox.stub();
    streamFactoryMock.expects('createHead').withExactArgs().returns(headStream);
    streamFactoryMock.expects('createNetwork').withExactArgs(name).returns(networkStream);
    streamFactoryMock.expects('create').withExactArgs(StreamType.CACHE, routeConfiguration.cache).returns(cacheStream);
    tokenizerMock.expects('tokenize').withExactArgs(name, routeConfiguration.identifier).returns(keyMaker);

    // Act
    requestManager.register(name, routeConfiguration);

    // Assert
    expect(headStream.connect.calledWithExactly(cacheStream)).to.eq(true);
    expect(cacheStream.connect.calledWithExactly(networkStream)).to.eq(true);
  });

  it("should handle new requests", () => {
    // Arrange
    const name = faker.random.word();
    const requestOptions: WardenRequestOptions = {
      url: faker.internet.url(),
      headers: {},
      method: 'get'
    };
    const routeConfiguration = {
      identifier: faker.random.word()
    } as RouteConfiguration;
    const headStream = {
      connect: sandbox.stub().returnsArg(0),
      start: sandbox.stub()
    };
    const networkStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const key = faker.random.word();
    const keyMaker = sandbox.stub().returns(key);
    streamFactoryMock.expects('createHead').withExactArgs().returns(headStream);
    streamFactoryMock.expects('createNetwork').withExactArgs(name).returns(networkStream);
    tokenizerMock.expects('tokenize').withExactArgs(name, routeConfiguration.identifier).returns(keyMaker);
    const stub = sandbox.stub();

    // Act
    requestManager.register(name, routeConfiguration);
    requestManager.handle(name, requestOptions, stub);

    // Assert
    expect(headStream.start.calledWithExactly(key, sinon.match.number, requestOptions, stub)).to.eq(true);
  });


  it("should handle request without custom headers", () => {
// Arrange
    const name = faker.random.word();
    const requestOptions: WardenRequestOptions = {
      url: faker.internet.url(),
      method: 'get'
    };
    const routeConfiguration = {
      identifier: faker.random.word()
    } as RouteConfiguration;
    const headStream = {
      connect: sandbox.stub().returnsArg(0),
      start: sandbox.stub()
    };
    const networkStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const key = faker.random.word();
    const keyMaker = sandbox.stub().returns(key);
    streamFactoryMock.expects('createHead').withExactArgs().returns(headStream);
    streamFactoryMock.expects('createNetwork').withExactArgs(name).returns(networkStream);
    tokenizerMock.expects('tokenize').withExactArgs(name, routeConfiguration.identifier).returns(keyMaker);
    const stub = sandbox.stub();

    // Act
    requestManager.register(name, routeConfiguration);
    requestManager.handle(name, requestOptions, stub);

    // Assert
    expect(headStream.start.calledWith(key, sinon.match.number, requestOptions, stub)).to.eq(true);
  });

  it("should throw error if not registered route tries to handle", () => {
    // Act
    const test = () => {
      requestManager.handle(faker.random.word(), {} as any, sandbox.stub());
    };

    // Assert
    expect(test).to.throw();
  });

  it("should return if route already registered", () => {
    // Arrange
    const name = faker.random.word();
    const routeConfiguration = {
      identifier: faker.random.word()
    } as RouteConfiguration;
    const headStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const networkStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const keyMaker = sandbox.stub();
    streamFactoryMock.expects('createHead').withExactArgs().returns(headStream);
    streamFactoryMock.expects('createNetwork').withExactArgs(name).returns(networkStream);
    tokenizerMock.expects('tokenize').withExactArgs(name, routeConfiguration.identifier).returns(keyMaker);

    // Act
    requestManager.register(name, routeConfiguration);
    const isRegistered = requestManager.isRouteRegistered(name);

    // Assert
    expect(headStream.connect.calledWithExactly(networkStream)).to.eq(true);
    expect(isRegistered).to.eq(true);
  });

  it("should remove if route already registered", () => {
    // Arrange
    const name = faker.random.word();
    const routeConfiguration = {
      identifier: faker.random.word()
    } as RouteConfiguration;
    const headStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const networkStream = {
      connect: sandbox.stub().returnsArg(0)
    };
    const keyMaker = sandbox.stub();
    streamFactoryMock.expects('createHead').withExactArgs().returns(headStream);
    streamFactoryMock.expects('createNetwork').withExactArgs(name).returns(networkStream);
    tokenizerMock.expects('tokenize').withExactArgs(name, routeConfiguration.identifier).returns(keyMaker);

    // Act
    requestManager.register(name, routeConfiguration);
    requestManager.unregister(name);
    const isRegistered = requestManager.isRouteRegistered(name);

    // Assert
    expect(isRegistered).to.eq(false);
  });
});
