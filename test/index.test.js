import assert from "assert";

import * as index from "../src";

describe("Resolver", function() {
  describe("exports", function() {
    const expected = [
      "client",
      "context",
      "resolve",
      "Resolver",
    ];

    it(`should export ${expected}`, function() {
      assert.deepEqual(Object.keys(index), expected);
    });
  });
});
