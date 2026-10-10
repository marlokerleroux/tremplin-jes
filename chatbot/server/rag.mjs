import { knowledge } from './knowledge.mjs';
import { retrieve as retrieveCore, answer as answerCore } from './rag-core.mjs';
export { validateMessages, terms, cosine } from './rag-core.mjs';
export const retrieve = (query, signal) => retrieveCore(query, signal, knowledge);
export const answer = (messages, signal) => answerCore(messages, signal, knowledge);
