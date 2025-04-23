import { MemoryI } from "@baseai/core";

const memoryAdvocadoMemory = (): MemoryI => ({
  name: "advocado-memory",
  description:
    "Advocado's memory of Steve, taken from his VitePress personal website.",
  git: {
    enabled: true,
    include: ["docs/**/*.md"],
    gitignore: true,
    deployedAt: "",
    embeddedAt: "",
  },
});

export default memoryAdvocadoMemory;
