export const PROVIDER_PRESETS=[
{id:"openai",name:"OpenAI",baseUrl:"https://api.openai.com/v1",type:"openai-compatible",model:"gpt-5"},
{id:"groq",name:"Groq",baseUrl:"https://api.groq.com/openai/v1",type:"openai-compatible",model:"llama-3.3-70b-versatile"},
{id:"openrouter",name:"OpenRouter",baseUrl:"https://openrouter.ai/api/v1",type:"openai-compatible",model:"openai/gpt-oss-120b"},
{id:"mistral",name:"Mistral",baseUrl:"https://api.mistral.ai/v1",type:"openai-compatible",model:"mistral-large-latest"},
{id:"deepseek",name:"DeepSeek",baseUrl:"https://api.deepseek.com/v1",type:"openai-compatible",model:"deepseek-chat"},
{id:"xai",name:"xAI",baseUrl:"https://api.x.ai/v1",type:"openai-compatible",model:"grok-4"},
{id:"together",name:"Together AI",baseUrl:"https://api.together.xyz/v1",type:"openai-compatible",model:"meta-llama/Llama-3.3-70B-Instruct-Turbo"},
{id:"fireworks",name:"Fireworks AI",baseUrl:"https://api.fireworks.ai/inference/v1",type:"openai-compatible",model:"accounts/fireworks/models/llama-v3p1-70b-instruct"},
{id:"ollama",name:"Ollama Local",baseUrl:"http://127.0.0.1:11434/v1",type:"openai-compatible",model:"llama3.2"},
{id:"lmstudio",name:"LM Studio Local",baseUrl:"http://127.0.0.1:1234/v1",type:"openai-compatible",model:"local-model"},
{id:"llamacpp",name:"llama.cpp Server",baseUrl:"http://127.0.0.1:8080/v1",type:"openai-compatible",model:"local-model"},
{id:"vllm",name:"vLLM Local",baseUrl:"http://127.0.0.1:8000/v1",type:"openai-compatible",model:"local-model"},
{id:"litellm",name:"LiteLLM Gateway",baseUrl:"http://127.0.0.1:4000/v1",type:"openai-compatible",model:"local-model"}
];
export function getPreset(id){return PROVIDER_PRESETS.find(x=>x.id===id)||null}
export function listPresets(){return PROVIDER_PRESETS}