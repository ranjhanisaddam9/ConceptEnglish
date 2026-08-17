import { shuffled } from "./sheet-order";
import { randomInk } from "./worksheet";

/**
 * A gap on a worksheet that the child fills in on screen.
 *
 * Shared by every sheet built around "one letter is missing" — Unit 1's
 * missing-letters sheet and Unit 2's writing sheet — because a gap is answered
 * the same way wherever it appears: tap it, choose from a handful of letters,
 * and be told there and then whether it was the right one. The builders hang
 * one of these off each blank they produce; see components/curriculum/gap-box
 * for what a child actually touches.
 *
 * None of it prints. A worksheet that arrives with the answers already filled
 * in is not a worksheet.
 */
export interface GapQuestion {
  id: string;
  /** The letter belonging in the gap. */
  answer: string;
  /** The answer and the wrong letters, shuffled. */
  options: string[];
  /**
   * The colour the gap is asked and answered in. Drawn from the sheet's seed
   * like every other colour here, so a sheet always asks in the same colours.
   */
  colour: string;
}

/**
 * How many letters are offered when a gap is answered: the right one and four
 * wrong ones.
 */
const SUGGESTION_COUNT = 5;

/**
 * Builds the question for one gap.
 *
 * The wrong letters come from the rest of the unit, never from what is already
 * on show around the gap: a letter the child can see is not a real choice.
 */
export function gapQuestion(
  id: string,
  answer: string,
  labels: string[],
  shown: Set<string>,
  random: () => number,
): GapQuestion {
  const distractors = shuffled(
    labels.filter((label) => label !== answer && !shown.has(label)),
    random,
  ).slice(0, SUGGESTION_COUNT - 1);

  return {
    id,
    answer,
    options: shuffled([answer, ...distractors], random),
    colour: randomInk(random),
  };
}
