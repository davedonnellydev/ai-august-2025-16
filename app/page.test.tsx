import { render, screen } from '@/test-utils';
import HomePage from './page';

// Seed localStorage utility
function seedDecks() {
  localStorage.setItem(
    'decks',
    JSON.stringify([
      {
        id: 'd1',
        title: 'Algebra I',
        topic: 'General Decks',
        difficulty: 'medium',
        bloomLevel: 'understand',
        format: 'qa',
        inputType: 'text',
        cards: [{ id: 'c1', order: 1, question: 'Q1', answer: 'A1' }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ])
  );
}

describe('Dashboard (HomePage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows empty state when no decks', () => {
    render(<HomePage />);
    expect(screen.getByText('No decks yet.')).toBeInTheDocument();
  });

  it('lists decks when present', () => {
    seedDecks();
    render(<HomePage />);
    expect(screen.getByText('Algebra I')).toBeInTheDocument();
    expect(screen.getByText('Study')).toBeInTheDocument();
  });
});
