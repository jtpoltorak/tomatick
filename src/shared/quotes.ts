import type { Phase } from './timer';

export interface Quote {
  text: string;
  author: string;
  /** Where the words come from, so the attribution can be checked. */
  source: string;
}

// Only quotes with a traceable source. Popular lines that are usually pinned on
// the wrong person (Twain's "secret of getting ahead", Einstein on staying with
// problems, Aristotle on excellence) are left out or credited to who said them.

/** Shown during focus: time, focus, priorities and effort. */
export const FOCUS_QUOTES: readonly Quote[] = [
  {
    text: 'Lost time is never found again.',
    author: 'Benjamin Franklin',
    source: 'Poor Richard’s Almanack, 1748',
  },
  {
    text: 'Dost thou love life? Then do not squander time, for that’s the stuff life is made of.',
    author: 'Benjamin Franklin',
    source: 'Poor Richard’s Almanack, 1746',
  },
  {
    text: 'How we spend our days is, of course, how we spend our lives.',
    author: 'Annie Dillard',
    source: 'The Writing Life, 1989',
  },
  {
    text: 'It is not that we have a short time to live, but that we waste a lot of it.',
    author: 'Seneca',
    source: 'On the Shortness of Life',
  },
  {
    text: 'Time is the scarcest resource, and unless it is managed nothing else can be managed.',
    author: 'Peter Drucker',
    source: 'The Effective Executive, 1967',
  },
  {
    text: 'Efficiency is doing things right; effectiveness is doing the right things.',
    author: 'Peter Drucker',
    source: 'The Effective Executive, 1967',
  },
  {
    text: 'I have two kinds of problems, the urgent and the important. The urgent are not important, and the important are never urgent.',
    author: 'Dwight D. Eisenhower',
    source: 'Address at Northwestern University, 1954',
  },
  {
    text: 'The key is not to prioritize what’s on your schedule, but to schedule your priorities.',
    author: 'Stephen R. Covey',
    source: 'The 7 Habits of Highly Effective People, 1989',
  },
  {
    text: 'Focusing is about saying no.',
    author: 'Steve Jobs',
    source: 'Apple Worldwide Developers Conference, 1997',
  },
  {
    text: 'To do two things at once is to do neither.',
    author: 'Publilius Syrus',
    source: 'Sentences, 1st century BC',
  },
  {
    text: 'Concentration is the secret of strength.',
    author: 'Ralph Waldo Emerson',
    source: 'The Conduct of Life, 1860',
  },
  {
    text: 'Wherever you are, be all there.',
    author: 'Jim Elliot',
    source: 'Journal, 1948',
  },
  {
    text: 'A journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    source: 'Tao Te Ching, chapter 64',
  },
  {
    text: 'He who has begun is half done. Dare to be wise.',
    author: 'Horace',
    source: 'Epistles, book 1',
  },
  {
    text: 'Genius is one percent inspiration and ninety-nine percent perspiration.',
    author: 'Thomas Edison',
    source: 'Quoted in Harper’s Monthly, 1932',
  },
  {
    text: 'The best way out is always through.',
    author: 'Robert Frost',
    source: 'A Servant to Servants, 1914',
  },
  {
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
    source: 'The Story of Philosophy, 1926, summing up Aristotle',
  },
  {
    text: 'Far and away the best prize that life offers is the chance to work hard at work worth doing.',
    author: 'Theodore Roosevelt',
    source: 'Labor Day speech, Syracuse, 1903',
  },
  {
    text: 'Tell me, what is it you plan to do with your one wild and precious life?',
    author: 'Mary Oliver',
    source: 'The Summer Day, 1990',
  },
];

/** Shown during breaks: rest, stepping away and resetting. */
export const BREAK_QUOTES: readonly Quote[] = [
  {
    text: 'Rest is not idleness, and to lie sometimes on the grass under trees on a summer’s day … is by no means a waste of time.',
    author: 'John Lubbock',
    source: 'The Use of Life, 1894',
  },
  {
    text: 'Almost everything will work again if you unplug it for a few minutes, including you.',
    author: 'Anne Lamott',
    source: 'TED talk, 2017',
  },
  {
    text: 'Take rest; a field that has rested gives a bountiful crop.',
    author: 'Ovid',
    source: 'Ars Amatoria',
  },
  {
    text: 'The mind must be given relaxation; it will rise better and keener after resting.',
    author: 'Seneca',
    source: 'On Tranquillity of Mind',
  },
  {
    text: 'The bow too tensely strung is easily broken.',
    author: 'Publilius Syrus',
    source: 'Sentences, 1st century BC',
  },
  {
    text: 'The time to relax is when you don’t have time for it.',
    author: 'Sydney J. Harris',
    source: 'Strictly Personal newspaper column',
  },
  {
    text: 'Sometimes the most important thing in a whole day is the rest we take between two deep breaths.',
    author: 'Etty Hillesum',
    source: 'Diaries, 1942',
  },
  {
    text: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.',
    author: 'Thich Nhat Hanh',
    source: 'Stepping into Freedom, 1997',
  },
  {
    text: 'All truly great thoughts are conceived while walking.',
    author: 'Friedrich Nietzsche',
    source: 'Twilight of the Idols, 1889',
  },
  {
    text: 'Methinks that the moment my legs begin to move, my thoughts begin to flow.',
    author: 'Henry David Thoreau',
    source: 'Journal, August 1851',
  },
  {
    text: 'Break clear away, once in a while, and climb a mountain or spend a week in the woods. Wash your spirit clean.',
    author: 'John Muir',
    source: 'Quoted in S. Hall Young, Alaska Days with John Muir, 1915',
  },
  {
    text: 'Pay attention. Be astonished. Tell about it.',
    author: 'Mary Oliver',
    source: 'Sometimes, 2008',
  },
];

/**
 * Picks a quote that fits the phase, avoiding the one already showing so a new
 * phase always brings a new quote.
 */
export function pickQuote(phase: Phase, previous?: Quote, random = Math.random): Quote {
  const pool = phase === 'work' ? FOCUS_QUOTES : BREAK_QUOTES;
  const choices = pool.filter((q) => q !== previous);
  return choices[Math.floor(random() * choices.length)] ?? pool[0];
}
