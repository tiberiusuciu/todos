import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Todo } from "../models/Todo.js";

const app = createApp();

async function registerAgent(email: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ email, password: "password123" });
  return agent;
}

describe("todo routes", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.status).toBe(401);
  });

  it("returns only the signed-in user's todos", async () => {
    const agentA = await registerAgent("usera@example.com");
    const agentB = await registerAgent("userb@example.com");

    await agentA.post("/api/todos").send({ title: "Task A" });
    await agentB.post("/api/todos").send({ title: "Task B" });

    const listA = await agentA.get("/api/todos");
    const listB = await agentB.get("/api/todos");

    expect(listA.body).toHaveLength(1);
    expect(listA.body[0].title).toBe("Task A");
    expect(listB.body).toHaveLength(1);
    expect(listB.body[0].title).toBe("Task B");
  });

  it("does not expose orphan todos", async () => {
    await Todo.create({ title: "Orphan", notes: "", emoji: "📋", userId: null });

    const agent = await registerAgent("userc@example.com");
    const res = await agent.get("/api/todos");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("assigns userId on create", async () => {
    const agent = await registerAgent("userd@example.com");
    const create = await agent.post("/api/todos").send({ title: "Mine" });

    expect(create.status).toBe(201);
    expect(create.body.userId).toBeTruthy();

    const stored = await Todo.findById(create.body._id);
    expect(stored?.userId?.toString()).toBe(create.body.userId);
  });

  it("prevents access to another user's todo", async () => {
    const agentA = await registerAgent("ownera@example.com");
    const agentB = await registerAgent("ownerb@example.com");

    const created = await agentA.post("/api/todos").send({ title: "Private" });
    const id = created.body._id as string;

    const patch = await agentB.patch(`/api/todos/${id}`).send({ title: "Hacked" });
    const del = await agentB.delete(`/api/todos/${id}`);

    expect(patch.status).toBe(404);
    expect(del.status).toBe(404);
  });
});
