import { MemoryI } from "@baseai/core";

const advocadoMemory = (): MemoryI => ({
  name: "advocado-memory",
  description:
    "Advocado's memory of Steve, taken from his VitePress personal website.",
  git: {
	enabled: true,
	include: ["docs/**/*.md"],
	gitignore: true,
	deployedAt: "",
	embeddedAt: '76442885b3be8aee5b4c2948fbfe2404672ada84'
},
});

export default advocadoMemory;
