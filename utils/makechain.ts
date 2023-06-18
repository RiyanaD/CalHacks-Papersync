import { OpenAI, PromptLayerOpenAI } from 'langchain/llms/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { LLMChain, loadQAChain, ChatVectorDBQAChain, ConversationChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';

const prompt =
    PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

    Chat History:
    {chat_history}
    Follow Up Input: {question}
    Standalone question:`);

const detailed_prompt = 

    PromptTemplate.fromTemplate(`You are a helpful AI assistant who is trying to help a user understand the following pieces context better if they have questions about it.
    Don't try answering questions that you don't know the answer too.
    If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.
    Don't make up any answers too and only answer accordingly to the context. 
    If asked something outside the context give a polite response to tell them that you can't answer it.

    {context}

Question: {question}
Helpful answer in markdown:`);

    export const makeChain = (vectorstore: PineconeStore) => {
        const questionGenerator = new LLMChain({
          llm: new OpenAI({ temperature: 0 }),
          prompt: prompt,
        });
      
        const docChain = loadQAChain(
          //change modelName to gpt-4 if you have access to it
          new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' }),
          {
            prompt: detailed_prompt,
          },
        );
      
        return new ConversationChain({
          vectorstore,
          combineDocumentsChain: docChain,
          questionGeneratorChain: questionGenerator,
          returnSourceDocuments: true,
          k: 1, //number of source documents to return. Change this figure as required.
        });
      };