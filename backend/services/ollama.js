import axios from "axios";
import dotenv from "dotenv"
dotenv.config();

//OLLAMA_URL is the base endpoint where the Ollama service is running, usually localhost with a default port.
export const OLLAMA_URL = process.env.OLLAMA_URL;
//OLLAMA_MODEL - which AI model to use, like mistral or llama2
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

//Sends chat-style messages to LLM - Used to send chat messages to Ollama AI
export async function ollamaChat(messages,{model = OLLAMA_MODEL, stream = false}={}){
    try {
        const {data} = await axios.post(`${OLLAMA_URL}/api/chat`,{
            model,
            messages,
            stream
        });
        return data?.message?.content ?? "";
    } catch (error) {
        console.error("ollamaChatError:",error.message);
    }
}

//Sends single prompt
export async function ollamaGenerate(prompt,{model = OLLAMA_MODEL, stream = false}={}){
    try {
        const {data} = await axios.post(`${OLLAMA_URL}/api/generate`,{
            model,
            prompt,
            stream
        });
        return data?.response ?? "";
    } catch (error) {
        console.error("ollamaGenerate Error:",error.message);
    }
}