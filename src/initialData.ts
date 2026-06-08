import { Poem, Category } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Nature & Seasons', color: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' },
  { id: 'cat-2', name: 'Love & Affection', color: 'bg-rose-950/50 text-rose-300 border-rose-800/45' },
  { id: 'cat-3', name: 'Reflection & Silence', color: 'bg-violet-950/50 text-violet-300 border-violet-800/40' },
  { id: 'cat-4', name: 'Hope & Dreams', color: 'bg-amber-950/50 text-amber-300 border-amber-800/45' },
  { id: 'cat-5', name: 'Modern & Free Verse', color: 'bg-sky-950/50 text-sky-300 border-sky-800/40' },
];

export const INITIAL_POEMS: Poem[] = [
  {
    id: 'poem-1',
    title: 'The Road Not Taken',
    body: `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`,
    categoryId: 'cat-3',
    tags: ['Robert Frost', 'choices', 'journey', 'classic'],
    mood: 'Reflective',
    author: 'Robert Frost',
    createdAt: new Date('1916-08-01T12:00:00Z').toISOString(),
  },
  {
    id: 'poem-2',
    title: 'A Red, Red Rose',
    body: `O my Luve is like a red, red rose
That’s newly sprung in June;
O my Luve is like the melody
That’s sweetly played in tune.

So fair art thou, my bonnie lass,
So deep in luve am I;
And I will luve thee still, my dear,
Till a’ the seas gang dry.

Till a’ the seas gang dry, my dear,
And the rocks melt wi’ the sun;
I will luve thee still, my dear,
While the sands o’ life shall run.

And fare thee weel, my only luve!
And fare thee weel awhile!
And I will come again, my luve,
Though it were ten thousand mile.`,
    categoryId: 'cat-2',
    tags: ['Robert Burns', 'romance', 'eternal', 'classic'],
    mood: 'Romantic',
    author: 'Robert Burns',
    createdAt: new Date('1794-01-01T12:00:00Z').toISOString(),
  },
  {
    id: 'poem-3',
    title: 'Hope is the thing with feathers',
    body: `“Hope” is the thing with feathers -
That perches in the soul -
And sings the tune without the words -
And never stops - at all -

And sweetest - in the Gale - is heard -
And sore must be the storm -
That could abash the little Bird
That kept so many warm -

I’ve heard it in the chillest land -
And on the strangest Sea -
Yet - never - in Extremity,
It asked a crumb - of me.`,
    categoryId: 'cat-4',
    tags: ['Emily Dickinson', 'metaphor', 'resilience', 'classic'],
    mood: 'Hopeful',
    author: 'Emily Dickinson',
    createdAt: new Date('1861-01-01T12:00:00Z').toISOString(),
  }
];
