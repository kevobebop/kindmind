import { cn } from "@/lib/utils";

describe("cn", () => {
  it("should return the correct class names", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });
});