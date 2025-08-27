import { render, screen, userEvent } from '@/test-utils';
import { DeckDetail, type DeckData } from './DeckDetail';

function makeDeck(overrides: Partial<DeckData> = {}): DeckData {
  return {
    id: 'deck_1',
    title: 'Sample Deck',
    topic: 'General Decks',
    difficulty: 'medium',
    bloomLevel: 'understand',
    format: 'qa',
    inputType: 'text',
    cards: [
      { id: 'card_1', order: 1, question: 'Q1', answer: 'A1' },
      { id: 'card_2', order: 2, question: 'Q2', answer: 'A2' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('DeckDetail', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders title and actions', () => {
    render(<DeckDetail deck={makeDeck()} />);
    expect(screen.getByText(/Deck: Sample Deck/)).toBeInTheDocument();
    expect(screen.getByText('Add Card')).toBeInTheDocument();
    expect(screen.getAllByText('Save changes').length).toBeGreaterThanOrEqual(
      2
    );
  });

  it('focuses newly added question after clicking Add Card', async () => {
    const user = userEvent.setup();
    render(<DeckDetail deck={makeDeck()} />);

    await user.click(screen.getByText('Add Card'));

    const questionInputs = screen.getAllByLabelText('Question');
    const lastQuestion = questionInputs[
      questionInputs.length - 1
    ] as HTMLTextAreaElement;
    expect(document.activeElement).toBe(lastQuestion);
  });

  it('persists changes to localStorage on edit', async () => {
    const user = userEvent.setup();
    render(<DeckDetail deck={makeDeck()} />);
    const firstQuestion = screen.getAllByLabelText('Question')[0];
    await user.clear(firstQuestion);
    await user.type(firstQuestion, 'Edited question');

    const stored = JSON.parse(localStorage.getItem('decks') || '[]');
    expect(Array.isArray(stored)).toBe(true);
    expect(stored[0].cards[0].question).toBe('Edited question');
  });
});
