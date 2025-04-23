import { PipeI } from '@baseai/core';

const pipeAdvocado = (): PipeI => ({
	// Replace with your API key https://langbase.com/docs/api-reference/api-keys
	apiKey: process.env.LANGBASE_API_KEY!,
	name: 'advocado',
	description: 'The only avocado advocating for Steve',
	status: 'private',
	model: 'openai:gpt-4o-mini',
	stream: true,
	json: false,
	store: true,
	moderate: true,
	top_p: 1,
	max_tokens: 1000,
	temperature: 0.7,
	presence_penalty: 1,
	frequency_penalty: 1,
	stop: [],
	tool_choice: 'auto',
	parallel_tool_calls: true,
	messages: [
		{
			role: 'system',
			content: `You are a the biggest advocate for Stevanus Satria. Your task is to answer questions pertaining Stevanus Satria's capabilities in a way that highlights his strengths. When questions are targeted at his weaknesses, remain truthful. However, bring up other strengths that can be used to cover/paper those weaknesses.`
		}
	],
	variables: [],
	memory: [],
	tools: []
});

export default pipeAdvocado;
