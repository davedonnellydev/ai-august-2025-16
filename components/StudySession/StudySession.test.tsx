import { render, screen, userEvent } from '@/test-utils';
import { StudySession } from './StudySession';
import type { DeckData } from '@/components/DeckDetail/DeckDetail';

function makeDeck(): DeckData {
  return {
    id: 'deck_1',
    title: 'Study Deck',
    topic: 'General Decks',
    difficulty: 'medium',
    bloomLevel: 'understand',
    format: 'qa',
    inputType: 'text',
    cards: [
      { id: 'c1', order: 1, question: 'What is 2+2?', answer: '4' },
      { id: 'c2', order: 2, question: 'What is 3+3?', answer: '6' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('StudySession', () => {
  it('renders pre-session options and starts session', async () => {
    const user = userEvent.setup();
    render(<StudySession deck={makeDeck()} />);

    expect(screen.getByText(/Study:\s*Study Deck/)).toBeInTheDocument();
    expect(screen.getByText('Study options')).toBeInTheDocument();
    await user.click(screen.getByText('Start session'));
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  it('shows answer then next', async () => {
    const user = userEvent.setup();
    render(<StudySession deck={makeDeck()} />);

    await user.click(screen.getByText('Start session'));
    await user.click(screen.getByText('Show answer'));
    expect(screen.getByText('Answer')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
