import { ToolI } from "@baseai/core";

export async function getCurrentWeather() {
  // Add your tool logic here
  // This function will be called when the tool is executed
}

const toolGetCurrentWeather = (): ToolI => ({
  run: getCurrentWeather,
  type: "function" as const,
  function: {
    name: "getCurrentWeather",
    description: "Get the current weather for a given location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
        },
      },
      required: ["location"],
    },
  },
});

export default toolGetCurrentWeather;
