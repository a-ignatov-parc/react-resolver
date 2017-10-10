/* global describe context it */

import React from 'react';
import assert from 'assert';
import PropTypes from 'prop-types';
import { renderToStaticMarkup } from 'react-dom/server';

import Resolver from '../src/Resolver';
import resolve from '../src/resolve';

function BaseTest(props) {
  const {
    expected,
    resolved,
  } = props;

  assert.equal(resolved, expected);

  return (
    <pre>{resolved}</pre>
  );
}

BaseTest.propTypes = {
  expected: PropTypes.string.isRequired,
  resolved: PropTypes.string.isRequired,
};

const Test = resolve('resolved', ({ actual }) => actual)(BaseTest);

describe('resolve HOC', () => {
  it('wraps Component name', () => {
    assert.equal(Test.displayName, 'ResolvedResolver');
  });

  context('with a scalar', () => {
    it('resolves', () => Resolver
      .resolve(() => (
        <Test
          actual="scalar"
          expected="scalar"
        />
      ))
      .then(({ data, Resolved }) => {
        assert.deepEqual(data, { '.0.0': { resolved: 'scalar' } });
        assert.equal(renderToStaticMarkup(<Resolved />), '<pre>scalar</pre>');
      }));

    it('is synchronous', () => {
      assert.equal(renderToStaticMarkup((
        <Test
          actual="scalar"
          expected="scalar"
        />
      )), '<pre>scalar</pre>');
    });
  });

  context('with a Promise ', () => {
    it('resolves', () => Resolver
      .resolve(() => (
        <Test
          actual={Promise.resolve('promise')}
          expected="promise"
        />
      ))
      .then(({ data, Resolved }) => {
        assert.deepEqual(data, { '.0.0': { resolved: 'promise' } });
        assert.equal(renderToStaticMarkup(<Resolved />), '<pre>promise</pre>');
      }));

    it('is asynchronous', () => {
      assert.equal(renderToStaticMarkup((
        <Test
          actual={Promise.resolve('promise')}
          expected="promise"
        />
      )), '');
    });
  });

  context('with a thenable', () => {
    const thenable = {
      then: next => next('thenable'),
    };

    it('resolves', () => Resolver
      .resolve(() => (
        <Test
          actual={thenable}
          expected="thenable"
        />
      ))
      .then(({ data, Resolved }) => {
        assert.deepEqual(data, { '.0.0': { resolved: 'thenable' } });
        assert.equal(renderToStaticMarkup(<Resolved />), '<pre>thenable</pre>');
      }));

    it('is asynchronous', () => {
      assert.equal(renderToStaticMarkup((
        <Test
          actual={thenable}
          expected="thenable"
        />
      )), '');
    });
  });
});
