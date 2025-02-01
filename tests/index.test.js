import { helloWorld } from "../src/index.js";

test("helloWorld function should return the expected greeting", () => {
  expect(helloWorld()).toBe("Hello from my-npm-package!");
});

