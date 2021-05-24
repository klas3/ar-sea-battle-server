import { customAlphabet } from 'nanoid';

const gameCodeAlphabet = '1234567890abcdefghijklmnopqrstuvwxyz';

const gameCodeSize = 5;

export const generateCode = customAlphabet(gameCodeAlphabet, gameCodeSize);
