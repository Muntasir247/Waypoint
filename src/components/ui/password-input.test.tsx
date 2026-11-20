import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { PasswordInput } from "./password-input";

describe("PasswordInput Component (Fix 5)", () => {
  it("renders with default type='password' and type='button' on toggle", () => {
    const html = renderToString(
      <PasswordInput
        id="password"
        name="password"
        placeholder="Enter password"
        autoComplete="current-password"
        required
      />,
    );

    // Verifies password type initially
    expect(html).toContain('type="password"');

    // Verifies button has type="button" so it does not submit forms
    expect(html).toContain('type="button"');

    // Verifies accessibility labels
    expect(html).toContain('aria-label="Show password"');
    expect(html).toContain('aria-pressed="false"');

    // Verifies forwarded HTML attributes for password managers
    expect(html).toContain('id="password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('placeholder="Enter password"');
    expect(html.toLowerCase()).toContain('autocomplete="current-password"');
    expect(html).toContain("required");
  });

  it("forwards disabled prop to both input and toggle button", () => {
    const html = renderToString(<PasswordInput id="disabled-pwd" disabled />);

    // Both input and button should be disabled
    const disabledCount = (html.match(/disabled/g) || []).length;
    expect(disabledCount).toBeGreaterThanOrEqual(2);
  });

  it("renders custom class names alongside default styles", () => {
    const html = renderToString(
      <PasswordInput id="custom-class" className="custom-test-class mt-2" />,
    );

    expect(html).toContain("custom-test-class");
    expect(html).toContain("mt-2");
    expect(html).toContain("rounded-xl");
  });

  it("renders SVG eye icon with aria-hidden='true' for screen reader clarity", () => {
    const html = renderToString(<PasswordInput id="icon-pwd" />);
    expect(html).toContain("<svg");
    expect(html).toContain('aria-hidden="true"');
  });
});
