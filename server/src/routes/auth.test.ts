import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("auth routes", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.REGISTRATION_CODE;
  });

  it("registers a new user and sets auth cookie", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(String), email: "alice@example.com" });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/token=/);
  });

  it("rejects duplicate email on register", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "password456" });

    expect(res.status).toBe(409);
  });

  it("logs in with valid credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "bob@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("bob@example.com");
  });

  it("rejects invalid login", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "bob@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("returns current user from /me when authenticated", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email: "me@example.com", password: "password123" });

    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me@example.com");
  });

  it("returns 401 from /me without auth", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("clears cookie on logout", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email: "out@example.com", password: "password123" });

    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401);
  });

  it("rejects registration without invite code in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.REGISTRATION_CODE = "a".repeat(64);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "password123" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Invalid invite code");
  });

  it("registers with valid invite code in production", async () => {
    const code = "b".repeat(64);
    process.env.NODE_ENV = "production";
    process.env.REGISTRATION_CODE = code;

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "invited@example.com", password: "password123", registrationCode: code });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("invited@example.com");
  });
});
