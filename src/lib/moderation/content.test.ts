import { describe, expect, it } from "vitest";
import { moderateText } from "./content";

describe("moderateText", () => {
  it("approves respectful messages", () => {
    const result = moderateText("Assalamu alaikum, I would like to know your family values.");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("APPROVED");
  });

  it("blocks explicit content", () => {
    const result = moderateText("looking for a hookup tonight");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("BLOCKED");
  });

  it("flags off-platform contact spam", () => {
    const result = moderateText("message me on whatsapp");
    expect(result.status).toBe("FLAGGED");
  });
});
