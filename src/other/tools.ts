import { customAlphabet } from 'nanoid';
import { emptyShipPosition, gameRowSize } from './constants';

const gameCodeAlphabet = '1234567890abcdefghijklmnopqrstuvwxyz';

const gameCodeSize = 5;

const leftSideMinRowIndex = 1;

const rightSideMaxRowIndex = 8;

const topSideMinIndex = 10;

const bottomSideMaxIndex = 89;

export const generateCode = customAlphabet(gameCodeAlphabet, gameCodeSize);

const checkRowPositionsСorrectness = (
  shipsPositions: number[],
  allowedPositions: number[],
  position: number,
) => {
  const currentPosition = shipsPositions[position];
  const isCurrentPositionAllowed =
    allowedPositions.find((allowedPosition) => allowedPosition === position) !== undefined;
  if (currentPosition !== emptyShipPosition && !isCurrentPositionAllowed) {
    return false;
  }
  const positionLastDigit = position % 10;
  let isCorrect = true;
  if (positionLastDigit >= leftSideMinRowIndex) {
    const previousPosition = shipsPositions[position - 1];
    const isAllowed =
      allowedPositions.find((allowedPosition) => allowedPosition === position - 1) !== undefined;
    isCorrect = isCorrect && (previousPosition === emptyShipPosition || isAllowed);
  }
  if (positionLastDigit <= rightSideMaxRowIndex) {
    const nextPosition = shipsPositions[position + 1];
    const isAllowed =
      allowedPositions.find((allowedPosition) => allowedPosition === position + 1) !== undefined;
    isCorrect = isCorrect && (nextPosition === emptyShipPosition || isAllowed);
  }
  return isCorrect;
};

export const isPositionCorrect = (
  shipsPositions: number[],
  allowedPositions: number[],
  position: number,
) => {
  let isCorrect = checkRowPositionsСorrectness(shipsPositions, allowedPositions, position);
  if (position >= topSideMinIndex) {
    isCorrect =
      isCorrect &&
      checkRowPositionsСorrectness(shipsPositions, allowedPositions, position - gameRowSize);
  }
  if (position <= bottomSideMaxIndex) {
    isCorrect =
      isCorrect &&
      checkRowPositionsСorrectness(shipsPositions, allowedPositions, position + gameRowSize);
  }
  return isCorrect;
};
