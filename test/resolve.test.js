import React from "react";
import assert from "assert";
import { renderToStaticMarkup } from "react-dom/server";

import Resolver from "../src/Resolver";
import resolve from "../src/resolve";

const Test = resolve("resolved", ({ actual }) => actual)(props => {
  const {
    expected,
    resolved,
  } = props;

  assert.equal(resolved, expected);

  return (
    <pre>{resolved}</pre>
  );
});

describe("resolve HOC", function() {
  it("wraps Component name", function() {
    assert.equal(Test.displayName, "ResolvedResolver");
  });

  context("with a scalar", function() {
    it("resolves", function() {
      return Resolver
        .resolve(() => (
          <Test
            actual="scalar"
            expected="scalar"
          />
        ))
        .then(({ data, Resolved }) => {
          assert.deepEqual(data, { '.0.0': { resolved: 'scalar' } });
          assert.equal(renderToStaticMarkup(<Resolved />), '<pre>scalar</pre>');
        });
    });

    it("is synchronous", function() {
      assert.equal(renderToStaticMarkup((
        <Test
          actual="scalar"
          expected="scalar"
        />
      )), "<pre>scalar</pre>");
    });
  });

  context("with a Promise ", function() {
    it("resolves", function() {
      return Resolver
        .resolve(() => (
          <Test
            actual={Promise.resolve("promise")}
            expected="promise"
          />
        ))
        .then(({ data, Resolved }) => {
          assert.deepEqual(data, { '.0.0': { resolved: 'promise' } });
          assert.equal(renderToStaticMarkup(<Resolved />), '<pre>promise</pre>');
        });
    });

    it("is asynchronous", function() {
      assert.equal(renderToStaticMarkup((
        <Test
          actual={Promise.resolve("promise")}
          expected="promise"
        />
      )), "");
    });
  });

  context("with a thenable", function() {
    const thenable = {
      then: resolve => resolve("thenable"),
    };

    it("resolves", function() {
      return Resolver
        .resolve(() => (
          <Test
            actual={thenable}
            expected="thenable"
          />
        ))
        .then(({ data, Resolved }) => {
          assert.deepEqual(data, { '.0.0': { resolved: 'thenable' } });
          assert.equal(renderToStaticMarkup(<Resolved />), '<pre>thenable</pre>');
        });
    });

    it("is asynchronous", function() {
      assert.equal(renderToStaticMarkup((
        <Test
          actual={thenable}
          expected="thenable"
        />
      )), "");
    });
  });
});
