import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./schemas";

describe("Auth schemas validation", () => {
  it("validates valid registration inputs", () => {
    const valid = {
      name: "Alex Rivera",
      email: "alex@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    };
    const res = registerSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects mismatched passwords during registration", () => {
    const invalid = {
      name: "Alex Rivera",
      email: "alex@example.com",
      password: "Password123",
      confirmPassword: "DifferentPassword123",
    };
    const res = registerSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.flatten().fieldErrors.confirmPassword).toBeDefined();
    }
  });

  it("validates login schema", () => {
    expect(loginSchema.safeParse({ email: "valid@email.com", password: "pwd" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "invalid-email", password: "pwd" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "valid@email.com", password: "" }).success).toBe(false);
  });

  it("validates password reset schema", () => {
    const valid = {
      token: "secure-token-123",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    };
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);

    const invalid = {
      token: "",
      password: "short",
      confirmPassword: "short",
    };
    expect(resetPasswordSchema.safeParse(invalid).success).toBe(false);
  });

  it("validates forgot password email input", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@acme.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
